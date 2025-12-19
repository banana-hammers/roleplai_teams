import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  skillsToAnthropicTools,
  findSkillByToolName,
  executeSkillTool
} from '@/lib/skills/to-anthropic-tools'
import {
  getAvailableBuiltinTools,
  isBuiltinTool,
  executeBuiltinTool
} from '@/lib/tools/builtin-tools'
import { decryptApiKey, isEncryptionConfigured } from '@/lib/crypto/api-key-encryption'
import type { Skill } from '@/types/skill'

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

    // Fetch user's identity core
    const { data: identityCore } = await supabase
      .from('identity_cores')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Fetch context packs linked to this role
    const { data: contextPacks } = await supabase
      .from('role_context_packs')
      .select(`
        context_pack_id,
        context_packs (
          name,
          content,
          type
        )
      `)
      .eq('role_id', roleId)

    // Fetch skills based on allowed_tools
    const allowedToolIds = (role.allowed_tools as string[]) || []
    let skills: Skill[] = []
    if (allowedToolIds.length > 0) {
      const { data: skillData } = await supabase
        .from('skills')
        .select('*')
        .in('id', allowedToolIds)
      skills = (skillData as Skill[]) || []
    }

    // Convert skills to Anthropic tools format
    const skillTools = skillsToAnthropicTools(skills)

    // Get built-in tools (web_search, web_fetch)
    const builtinTools = getAvailableBuiltinTools()

    // Combine all tools (cast skill tools to match Anthropic.Tool type)
    const tools: Anthropic.Tool[] = [
      ...builtinTools,
      ...skillTools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema as Anthropic.Tool['input_schema']
      }))
    ]

    // Build the system prompt with identity + role + context
    const systemPromptParts: string[] = []

    // Add identity core if available
    if (identityCore) {
      systemPromptParts.push(`# Your Identity Core
Voice: ${identityCore.voice}

Priorities:
${JSON.stringify(identityCore.priorities, null, 2)}

Boundaries:
${JSON.stringify(identityCore.boundaries, null, 2)}

Decision Rules:
${JSON.stringify(identityCore.decision_rules, null, 2)}
`)
    }

    // Add role instructions
    systemPromptParts.push(`# Role: ${role.name}
${role.description || ''}

## Instructions
${role.instructions}

## Identity Facets
${JSON.stringify(role.identity_facets, null, 2)}

## Approval Policy
${role.approval_policy}
`)

    // Add available tools info to system prompt
    if (tools.length > 0) {
      systemPromptParts.push(`## Available Skills
You have access to the following skills. Use them when appropriate:
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}
`)
    }

    // Add context packs
    if (contextPacks && contextPacks.length > 0) {
      systemPromptParts.push('# Context Packs')
      contextPacks.forEach((cp: any) => {
        const pack = cp.context_packs
        systemPromptParts.push(`\n## ${pack.name} (${pack.type})
${pack.content}`)
      })
    }

    const systemPrompt = systemPromptParts.join('\n\n---\n\n')

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
                } else {
                  // Try to find a matching skill
                  const skill = findSkillByToolName(skills, tc.name)
                  if (skill) {
                    result = executeSkillTool(skill, tc.input)
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
