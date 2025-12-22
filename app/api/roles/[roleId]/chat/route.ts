import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  skillsToAnthropicTools,
  findSkillByToolName,
} from '@/lib/skills/to-anthropic-tools'
import {
  executeSkillWithTools,
  executeSkillSimple,
} from '@/lib/skills/execute-skill'
import {
  getAvailableBuiltinTools,
  isBuiltinTool,
  executeBuiltinTool
} from '@/lib/tools/builtin-tools'
import {
  getMcpToolsFromServers,
  isMcpTool,
  executeMcpTool
} from '@/lib/tools/mcp-tools'
import { decryptApiKey, isEncryptionConfigured } from '@/lib/crypto/api-key-encryption'
import type { McpServer } from '@/types/mcp'
import { buildRoleSystemPrompt } from '@/lib/prompts/system-prompt-builder'
import type { Skill } from '@/types/skill'
import type { IdentityCore, Lore } from '@/types/identity'
import type { Role, ResolvedSkill } from '@/types/role'

export const runtime = 'edge'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params
    const { messages } = await req.json()

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Fetch the role and verify ownership
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !role) {
      return new Response('Role not found', { status: 404 })
    }

    // Fetch user profile, identity core, lore, skills, and MCP servers in parallel
    const [profileResult, identityCoreResult, roleLoreResult, roleSkillLinksResult, mcpServersResult] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      supabase.from('identity_cores').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('role_lore').select(`
        lore_id,
        lore (
          id,
          user_id,
          name,
          content,
          type,
          created_at,
          updated_at
        )
      `).eq('role_id', roleId),
      supabase.from('role_skills').select('skill_id').eq('role_id', roleId),
      supabase.from('mcp_servers').select('*').eq('role_id', roleId).eq('user_id', user.id).eq('is_enabled', true),
    ])

    const userName = profileResult.data?.full_name || undefined
    const identityCore = identityCoreResult.data as IdentityCore | null
    const roleLore = roleLoreResult.data

    // Fetch skills if there are skill links
    let skills: Skill[] = []
    if (roleSkillLinksResult.data && roleSkillLinksResult.data.length > 0) {
      const skillIds = roleSkillLinksResult.data.map(link => link.skill_id)
      const { data: skillData } = await supabase
        .from('skills')
        .select('*')
        .in('id', skillIds)
      skills = (skillData as Skill[]) || []
    }

    // Convert skills to Anthropic tools format
    const skillTools = skillsToAnthropicTools(skills)

    // Get built-in tools (web_search, web_fetch)
    const builtinTools = getAvailableBuiltinTools()

    // Get MCP tools from enabled servers
    const mcpServers = (mcpServersResult.data || []) as McpServer[]
    const { tools: mcpTools, toolMappings: mcpToolMappings, errors: mcpErrors } = await getMcpToolsFromServers(mcpServers)

    // Combine all tools (cast skill tools to match Anthropic.Tool type)
    const tools: Anthropic.Tool[] = [
      ...builtinTools,
      ...skillTools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema as Anthropic.Tool['input_schema']
      })),
      ...mcpTools
    ]

    // Convert lore to proper format
    const loreItems: Lore[] = roleLore?.map((rl: any) => rl.lore as Lore).filter(Boolean) || []

    // Convert skills to resolved format for prompt (with short_description for Level 1)
    const resolvedSkills: ResolvedSkill[] = skills.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description || null,
      short_description: s.short_description || null,
    }))

    // Build the system prompt using the new character-aware builder
    const systemPrompt = buildRoleSystemPrompt({
      role: role as Role,
      identityCore,
      lore: loreItems,
      skills: resolvedSkills,
      userName,
    })

    // Get API key (fall back to system key)
    const { data: apiKeys } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', 'anthropic')
      .maybeSingle()

    let apiKey: string | undefined

    // Decrypt user's API key if available
    if (apiKeys?.encrypted_key && isEncryptionConfigured()) {
      try {
        apiKey = await decryptApiKey(apiKeys.encrypted_key, user.id)
      } catch (error) {
        console.error('Failed to decrypt API key:', error)
        // Fall through to system key
      }
    }

    // Fall back to system key
    if (!apiKey) {
      apiKey = process.env.ANTHROPIC_API_KEY
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'No API key available. Please add your own API key in settings.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey })

    // Get model from role preference or use default
    const modelName = role.model_preference?.split('/')[1] || 'claude-sonnet-4-5-20250929'

    // Convert messages to Anthropic format
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

    // Create a streaming response using SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Notify client of any MCP server errors
          if (mcpErrors.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'mcp_error',
              errors: mcpErrors.map(e => ({ server: e.serverName, message: e.message }))
            })}\n\n`))
          }

          // Agentic loop: keep going until no more tool calls
          let currentMessages = [...anthropicMessages]
          let continueLoop = true

          while (continueLoop) {
            const response = await anthropic.messages.create({
              model: modelName,
              max_tokens: 4096,
              // Use prompt caching for system prompt (90% cost savings on cache hits)
              system: [
                {
                  type: 'text',
                  text: systemPrompt,
                  cache_control: { type: 'ephemeral' }
                }
              ],
              messages: currentMessages,
              tools: tools.length > 0 ? tools as Anthropic.Tool[] : undefined,
              stream: true,
            })

            let fullText = ''
            const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = []
            let currentToolCall: { id: string; name: string; input: string } | null = null

            for await (const event of response) {
              if (event.type === 'content_block_start') {
                if (event.content_block.type === 'tool_use') {
                  currentToolCall = {
                    id: event.content_block.id,
                    name: event.content_block.name,
                    input: ''
                  }
                  // Send tool call start event
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'tool_call_start',
                    tool: event.content_block.name
                  })}\n\n`))
                }
              } else if (event.type === 'content_block_delta') {
                if (event.delta.type === 'text_delta') {
                  fullText += event.delta.text
                  // Stream text to client
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'text',
                    content: event.delta.text
                  })}\n\n`))
                } else if (event.delta.type === 'input_json_delta' && currentToolCall) {
                  currentToolCall.input += event.delta.partial_json
                }
              } else if (event.type === 'content_block_stop') {
                if (currentToolCall) {
                  try {
                    const input = JSON.parse(currentToolCall.input)
                    toolCalls.push({
                      id: currentToolCall.id,
                      name: currentToolCall.name,
                      input
                    })
                  } catch {
                    // Invalid JSON, skip this tool call
                  }
                  currentToolCall = null
                }
              } else if (event.type === 'message_stop') {
                // Message complete
              }
            }

            // If there are tool calls, execute them and continue the loop
            if (toolCalls.length > 0) {
              // Add assistant message with tool calls
              const assistantContent: Anthropic.ContentBlockParam[] = []
              if (fullText) {
                assistantContent.push({ type: 'text', text: fullText })
              }
              for (const tc of toolCalls) {
                assistantContent.push({
                  type: 'tool_use',
                  id: tc.id,
                  name: tc.name,
                  input: tc.input
                })
              }
              currentMessages.push({
                role: 'assistant',
                content: assistantContent
              })

              // Execute tools and add results
              const toolResults: Anthropic.ToolResultBlockParam[] = []
              for (const tc of toolCalls) {
                let result: string

                // Check if it's a built-in tool first
                if (isBuiltinTool(tc.name)) {
                  result = await executeBuiltinTool(tc.name, tc.input)
                } else if (isMcpTool(tc.name, mcpToolMappings)) {
                  // Execute MCP tool
                  result = await executeMcpTool(tc.name, tc.input, mcpToolMappings)
                } else {
                  // Try to find a matching skill
                  const skill = findSkillByToolName(skills, tc.name)
                  if (skill) {
                    // Fetch linked lore for Level 3 context
                    let linkedLore: Lore[] = []
                    if (skill.linked_lore_ids?.length > 0) {
                      const { data: loreData } = await supabase
                        .from('lore')
                        .select('*')
                        .in('id', skill.linked_lore_ids)
                      linkedLore = (loreData as Lore[]) || []
                    }

                    // Check if skill has allowed tools (agentic mode)
                    if (skill.allowed_tools?.length > 0) {
                      // Create tool execution function for nested calls
                      const executeToolCall = async (name: string, input: Record<string, unknown>): Promise<string> => {
                        if (isBuiltinTool(name)) {
                          return executeBuiltinTool(name, input)
                        } else if (isMcpTool(name, mcpToolMappings)) {
                          return executeMcpTool(name, input, mcpToolMappings)
                        } else {
                          // Could be chaining to another skill
                          const chainedSkill = findSkillByToolName(skills, name)
                          if (chainedSkill) {
                            return executeSkillSimple(chainedSkill, input)
                          }
                          return `Error: Unknown tool "${name}"`
                        }
                      }

                      // Agentic execution with nested tool loop
                      result = await executeSkillWithTools(skill, tc.input, {
                        anthropic,
                        availableTools: tools,
                        linkedLore,
                        executeToolCall,
                        onToolCall: (name, toolResult) => {
                          // Stream nested tool calls to client
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'skill_tool_call',
                            skill: skill.name,
                            tool: name,
                            result: toolResult.slice(0, 200) // Truncate for UI
                          })}\n\n`))
                        }
                      })
                    } else {
                      // Simple execution with Level 2+3 context
                      result = executeSkillSimple(skill, tc.input, linkedLore)
                    }
                  } else {
                    result = `Error: Unknown tool "${tc.name}"`
                  }
                }

                // Send tool result event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'tool_result',
                  tool: tc.name,
                  result
                })}\n\n`))

                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: tc.id,
                  content: result
                })
              }

              currentMessages.push({
                role: 'user',
                content: toolResults
              })
            } else {
              // No tool calls, exit the loop
              continueLoop = false
            }
          }

          // Send done event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'An error occurred while processing your request'
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Role chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
