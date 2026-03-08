import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { streamText, jsonSchema, stepCountIs } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import {
  skillsToAnthropicTools,
  skillsToGenericTools,
  findSkillByToolName,
} from '@/lib/skills/to-anthropic-tools'
import {
  executeSkillWithTools,
  executeSkillSimple,
} from '@/lib/skills/execute-skill'
import {
  getAvailableBuiltinTools,
  getBuiltinToolsForProvider,
  isBuiltinTool,
  isServerTool,
  executeBuiltinTool
} from '@/lib/tools/builtin-tools'
import {
  getMcpToolsFromServers,
  getMcpToolsGeneric,
  isMcpTool,
  executeMcpTool
} from '@/lib/tools/mcp-tools'
import { resolveApiKey } from '@/lib/ai/resolve-api-key'
import { errorResponse, DEFAULT_TEMPERATURE } from '@/lib/ai/create-system-model'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'
import type { McpServer } from '@/types/mcp'
import type { McpToolServerMapping } from '@/lib/mcp/types'
import { buildRoleSystemPrompt } from '@/lib/prompts/system-prompt-builder'
import { calculateMessageCost, formatCost } from '@/lib/pricing/model-pricing'
import { formatWebSearchResults } from '@/lib/tools/format-web-search'
import { withRetry } from '@/lib/errors/retry'
import {
  isRateLimitError,
  getRetryAfterMs,
  ERROR_MESSAGES
} from '@/lib/errors/api-errors'
import type { Skill } from '@/types/skill'
import type { IdentityCore, Lore } from '@/types/identity'
import type { Role, ResolvedSkill } from '@/types/role'
import type { GenericToolDefinition } from '@/lib/tools/types'

/** Message format received from the client */
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Anthropic stream event with usage in message_start */
interface AnthropicMessageStartUsage {
  input_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

/** Anthropic stream event with usage in message_delta */
interface AnthropicMessageDeltaUsage {
  output_tokens?: number
}

/** AI SDK tool definition with execute function */
interface AISDKToolDefinition {
  description: string
  parameters: ReturnType<typeof jsonSchema>
  execute: (input: Record<string, unknown>) => Promise<string>
}

/** Conversation summary from database */
interface ConversationSummary {
  title: string
  summary: string | null
  updated_at: string
}

export const runtime = 'edge'

/**
 * Helper to encode SSE data
 */
function sseEvent(encoder: TextEncoder, data: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

/**
 * Execute a simple skill (no agentic tools) and emit SSE progress events.
 * Shared between OpenAI and Anthropic streaming paths.
 */
function executeSimpleSkillWithEvents(
  skill: Skill,
  input: Record<string, unknown>,
  linkedLore: Lore[],
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  toolContext?: { toolId?: string; toolName?: string },
): string {
  const skillExecutionId = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  controller.enqueue(sseEvent(encoder, {
    type: 'skill_start',
    skillId: skillExecutionId,
    skillName: skill.name,
    ...(toolContext?.toolId && { toolId: toolContext.toolId }),
    toolName: toolContext?.toolName,
    inputs: input,
    maxIterations: 1,
    isSimple: true,
  }))

  const result = executeSkillSimple(skill, input, linkedLore)

  controller.enqueue(sseEvent(encoder, {
    type: 'skill_complete',
    skillId: skillExecutionId,
    skillName: skill.name,
    result: result.slice(0, 500),
    totalIterations: 1,
  }))

  return result
}

/**
 * Convert generic tool definitions to Vercel AI SDK tool format with execute functions.
 * Uses jsonSchema() for type-safe schema wrapping without Zod conversion.
 */
function toAISDKTools(
  genericSkillTools: GenericToolDefinition[],
  genericBuiltinTools: GenericToolDefinition[],
  genericMcpTools: GenericToolDefinition[],
  skills: Skill[],
  mcpToolMappings: Map<string, McpToolServerMapping>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
) {
  const tools: Record<string, AISDKToolDefinition> = {}

  // Add built-in tools (web_fetch for OpenAI)
  for (const bt of genericBuiltinTools) {
    tools[bt.name] = {
      description: bt.description,
      parameters: jsonSchema(bt.parameters as Record<string, unknown>),
      execute: async (input: Record<string, unknown>) => {
        return executeBuiltinTool(bt.name, input)
      },
    }
  }

  // Add skill tools
  for (const st of genericSkillTools) {
    tools[st.name] = {
      description: st.description,
      parameters: jsonSchema(st.parameters as Record<string, unknown>),
      execute: async (input: Record<string, unknown>) => {
        const skill = findSkillByToolName(skills, st.name)
        if (!skill) return `Error: Unknown skill "${st.name}"`

        // Fetch linked lore for Level 3 context
        let linkedLore: Lore[] = []
        if (skill.linked_lore_ids?.length > 0) {
          const { data: loreData } = await supabase
            .from('lore')
            .select('*')
            .in('id', skill.linked_lore_ids)
          linkedLore = (loreData as Lore[]) || []
        }

        // Simple execution for OpenAI (no agentic nested loop)
        return executeSimpleSkillWithEvents(
          skill, input, linkedLore, encoder, controller,
          { toolName: st.name },
        )
      },
    }
  }

  // Add MCP tools
  for (const mt of genericMcpTools) {
    tools[mt.name] = {
      description: mt.description,
      parameters: jsonSchema(mt.parameters as Record<string, unknown>),
      execute: async (input: Record<string, unknown>) => {
        return executeMcpTool(mt.name, input, mcpToolMappings)
      },
    }
  }

  return tools
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params
    const { messages, conversationId } = await req.json()

    // SAFETY: Validate messages input
    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse('Messages must be a non-empty array', 400)
    }
    if (messages.length > 200) {
      return errorResponse('Too many messages', 400)
    }

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // SECURITY: Rate limit by user ID
    const rateLimitResult = await rateLimit(
      `chat:${user.id}`,
      RATE_LIMITS.chat.limit,
      RATE_LIMITS.chat.windowMs
    )

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    // Fetch the role and verify ownership
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !role) {
      return errorResponse('Role not found', 404)
    }

    // Parse provider from model_preference (format: "provider/model")
    const [provider, modelName] = (() => {
      const pref = role.model_preference || 'anthropic/claude-haiku-4-5'
      const parts = pref.split('/')
      if (parts.length === 2) return [parts[0], parts[1]]
      return ['anthropic', pref] // Legacy: bare model name defaults to Anthropic
    })()

    // SECURITY: Check spend limit for BYO API key users
    const { data: apiKeyRow } = await supabase
      .from('user_api_keys')
      .select('spend_limit')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .maybeSingle()

    if (apiKeyRow?.spend_limit != null) {
      const { data: monthlySpend, error: spendError } = await supabase
        .rpc('get_monthly_spend')

      if (spendError) {
        console.error('Failed to check spend limit:', spendError)
      }

      const spend = typeof monthlySpend === 'number' ? monthlySpend : 0

      if (!spendError && spend >= apiKeyRow.spend_limit) {
        return errorResponse(
          `Monthly spend limit of $${apiKeyRow.spend_limit.toFixed(2)} reached (current: $${spend.toFixed(2)}). Update your spend limit in settings to continue.`,
          402
        )
      }
    }

    // Fetch user profile, identity core, lore, skills, MCP servers, and recent summaries in parallel
    const [profileResult, identityCoreResult, roleLoreResult, roleSkillLinksResult, mcpServersResult, recentSummariesResult] = await Promise.all([
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
      supabase.from('role_skills').select('skill_id, skills(*)').eq('role_id', roleId),
      supabase.from('mcp_servers').select('*').eq('role_id', roleId).eq('user_id', user.id).eq('is_enabled', true),
      // Fetch last 5 conversations with summaries for memory lite
      supabase.from('conversations')
        .select('title, summary, updated_at')
        .eq('role_id', roleId)
        .eq('user_id', user.id)
        .not('summary', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(5),
    ])

    const userName = profileResult.data?.full_name || undefined
    const identityCore = identityCoreResult.data as IdentityCore | null
    const roleLore = roleLoreResult.data

    // Extract skills from nested select (no second query needed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const skills: Skill[] = (roleSkillLinksResult.data || [] as any[])
      .map((link: { skills: Skill | null }) => link.skills)
      .filter(Boolean) as Skill[]

    // Get MCP tools from enabled servers
    const mcpServers = (mcpServersResult.data || []) as McpServer[]
    const { tools: mcpTools, toolMappings: mcpToolMappings, errors: mcpErrors } = await getMcpToolsFromServers(mcpServers)

    // Convert lore to proper format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loreItems: Lore[] = (roleLore as any[] || []).map((rl: { lore: Lore | null }) => rl.lore as Lore).filter(Boolean)

    // Convert skills to resolved format for prompt (with short_description for Level 1)
    const resolvedSkills: ResolvedSkill[] = skills.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description || null,
      short_description: s.short_description || null,
    }))

    // Determine if this is the first message in the conversation
    const isFirstMessage = messages.length <= 1

    // Convert recent summaries for memory lite
    const pastConversations = (recentSummariesResult.data || [])
      .filter((c: ConversationSummary) => c.summary)
      .map((c: ConversationSummary) => ({
        title: c.title,
        summary: c.summary as string,
        date: new Date(c.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))

    // Build the system prompt using the character-aware builder
    const systemPrompt = buildRoleSystemPrompt({
      role: role as Role,
      identityCore,
      lore: loreItems,
      skills: resolvedSkills,
      userName,
      isFirstMessage,
      pastConversations,
    })

    // Get API key with correct provider
    const apiKey = await resolveApiKey(supabase, user.id, provider as 'anthropic' | 'openai')

    if (!apiKey) {
      return errorResponse('No API key available. Please add your own API key in settings.', 400)
    }

    // Route to provider-specific streaming implementation
    if (provider === 'openai') {
      return streamOpenAI({
        apiKey,
        modelName,
        systemPrompt,
        messages,
        skills,
        mcpTools,
        mcpToolMappings,
        mcpErrors,
        supabase,
        conversationId,
        provider,
      })
    } else {
      return streamAnthropic({
        apiKey,
        modelName,
        systemPrompt,
        messages,
        skills,
        mcpTools,
        mcpToolMappings,
        mcpErrors,
        role,
        supabase,
        conversationId,
        provider,
      })
    }
  } catch (error) {
    console.error('Role chat API error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ─── OpenAI Streaming Path ────────────────────────────────────────────────────

interface OpenAIStreamParams {
  apiKey: string
  modelName: string
  systemPrompt: string
  messages: ChatMessage[]
  skills: Skill[]
  mcpTools: Anthropic.Tool[]
  mcpToolMappings: Map<string, McpToolServerMapping>
  mcpErrors: Array<{ serverName: string; message: string }>
  supabase: Awaited<ReturnType<typeof createClient>>
  conversationId?: string
  provider: string
}

function streamOpenAI(params: OpenAIStreamParams): Response {
  const {
    apiKey, modelName, systemPrompt, messages, skills,
    mcpTools, mcpToolMappings, mcpErrors, supabase,
    conversationId, provider,
  } = params

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Notify client of any MCP server errors
        if (mcpErrors.length > 0) {
          controller.enqueue(sseEvent(encoder, {
            type: 'mcp_error',
            errors: mcpErrors.map(e => ({ server: e.serverName, message: e.message })),
          }))
        }

        const openai = createOpenAI({ apiKey })

        // Build tools in AI SDK format
        const genericSkillTools = skillsToGenericTools(skills)
        const genericBuiltinTools = getBuiltinToolsForProvider('openai')
        const genericMcpTools = getMcpToolsGeneric(mcpToolMappings, mcpTools)

        const aiSdkTools = toAISDKTools(
          genericSkillTools, genericBuiltinTools, genericMcpTools,
          skills, mcpToolMappings, supabase, encoder, controller,
        )

        // Convert messages to AI SDK format
        const aiMessages = messages.map((m: ChatMessage) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

        // Stream using Vercel AI SDK
        const result = streamText({
          model: openai(modelName),
          system: systemPrompt,
          messages: aiMessages,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: Object.keys(aiSdkTools).length > 0 ? aiSdkTools as any : undefined,
          stopWhen: stepCountIs(5),
          temperature: DEFAULT_TEMPERATURE,
        })

        // Track usage and full response text
        let totalInputTokens = 0
        let totalOutputTokens = 0
        let fullText = ''

        // Process the full stream and emit our SSE events
        for await (const part of result.fullStream) {
          switch (part.type) {
            case 'text-delta':
              fullText += part.text
              controller.enqueue(sseEvent(encoder, {
                type: 'text',
                content: part.text,
              }))
              break

            case 'tool-call':
              // Emit tool_call_start
              controller.enqueue(sseEvent(encoder, {
                type: 'tool_call_start',
                id: part.toolCallId,
                tool: part.toolName,
              }))
              break

            case 'tool-result':
              // Emit tool_result (the execute() already ran via AI SDK)
              controller.enqueue(sseEvent(encoder, {
                type: 'tool_result',
                id: part.toolCallId,
                tool: part.toolName,
                input: part.input,
                result: typeof part.output === 'string' ? part.output : JSON.stringify(part.output),
              }))
              break

            case 'finish-step':
              // Accumulate usage from each step
              if (part.usage) {
                totalInputTokens += part.usage.inputTokens || 0
                totalOutputTokens += part.usage.outputTokens || 0
              }
              break

            case 'error':
              controller.enqueue(sseEvent(encoder, {
                type: 'error',
                message: part.error instanceof Error ? part.error.message : String(part.error),
              }))
              break
          }
        }

        // Calculate and send usage/cost data
        const usage = {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
        }
        const cost = calculateMessageCost(modelName, usage)
        controller.enqueue(sseEvent(encoder, {
          type: 'usage',
          ...usage,
          cost,
          formattedCost: formatCost(cost),
        }))

        // Persist assistant message with usage metadata server-side
        if (conversationId && fullText) {
          try {
            const { data: savedMsg } = await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: fullText,
                metadata: {
                  usage: { ...usage, cost },
                  model: modelName,
                  provider,
                },
              })
              .select('id')
              .single()

            if (savedMsg) {
              controller.enqueue(sseEvent(encoder, {
                type: 'message_saved',
                messageId: savedMsg.id,
              }))
            }
          } catch (saveError) {
            console.error('[OpenAI] Failed to persist assistant message:', saveError)
          }
        }

        // Send done event
        controller.enqueue(sseEvent(encoder, { type: 'done' }))
        controller.close()
      } catch (error) {
        console.error('[OpenAI] Stream error:', error)
        controller.enqueue(sseEvent(encoder, {
          type: 'error',
          message: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        }))
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
}

// ─── Anthropic Streaming Path ─────────────────────────────────────────────────

interface AnthropicStreamParams {
  apiKey: string
  modelName: string
  systemPrompt: string
  messages: ChatMessage[]
  skills: Skill[]
  mcpTools: Anthropic.Tool[]
  mcpToolMappings: Map<string, McpToolServerMapping>
  mcpErrors: Array<{ serverName: string; message: string }>
  role: Role
  supabase: Awaited<ReturnType<typeof createClient>>
  conversationId?: string
  provider: string
}

/**
 * Anthropic streaming path with agentic tool loop.
 *
 * Flow:
 * 1. Convert messages to Anthropic format and initialize the agentic loop
 * 2. Stream the Anthropic response, emitting SSE events for text deltas,
 *    tool call starts, server tool results (web_search), and usage tracking
 * 3. When tool calls are detected, execute them:
 *    - Server tools (web_search): handled by Anthropic, results come as content blocks
 *    - Built-in tools (web_fetch): executed via executeBuiltinTool()
 *    - MCP tools: routed to the user's MCP server via executeMcpTool()
 *    - Skills (simple): executed via executeSimpleSkillWithEvents()
 *    - Skills (agentic): executed via executeSkillWithTools() with nested tool loop
 * 4. Tool results are appended to messages and the loop continues (max 10 iterations)
 * 5. When no more tool calls, emit usage/cost data and persist the assistant message
 * 6. Rate limit errors trigger retry with exponential backoff (max 3 retries)
 */
function streamAnthropic(params: AnthropicStreamParams): Response {
  const {
    apiKey, modelName, systemPrompt, messages, skills,
    mcpTools, mcpToolMappings, mcpErrors, role, supabase,
    conversationId, provider,
  } = params

  // Convert skills to Anthropic tools format
  const skillTools = skillsToAnthropicTools(skills)

  // Get built-in tools (web_search, web_fetch)
  const builtinTools = getAvailableBuiltinTools()

  // Combine all tools
  const tools: Anthropic.ToolUnion[] = [
    ...builtinTools,
    ...skillTools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema as Anthropic.Tool['input_schema']
    })),
    ...mcpTools
  ]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Notify client of any MCP server errors
        if (mcpErrors.length > 0) {
          controller.enqueue(sseEvent(encoder, {
            type: 'mcp_error',
            errors: mcpErrors.map(e => ({ server: e.serverName, message: e.message })),
          }))
        }

        // Initialize Anthropic client
        const anthropic = new Anthropic({ apiKey })

        // Convert messages to Anthropic format
        const anthropicMessages: Anthropic.MessageParam[] = messages.map((m: ChatMessage) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))

        // Agentic loop: keep going until no more tool calls
        let currentMessages = [...anthropicMessages]
        let continueLoop = true
        let loopIterations = 0
        const MAX_LOOP_ITERATIONS = 10

        // Track server tool inputs so we can match them with results
        const serverToolInputs = new Map<string, Record<string, unknown>>()

        // Track total usage and full response text across all iterations
        let totalInputTokens = 0
        let totalOutputTokens = 0
        let totalCacheCreationTokens = 0
        let totalCacheReadTokens = 0
        let totalFullText = ''

        while (continueLoop) {
          if (++loopIterations > MAX_LOOP_ITERATIONS) {
            console.warn('[Chat] Agentic loop exceeded max iterations')
            break
          }

          // Use retry with exponential backoff for rate limit errors
          const response = await withRetry(
            () =>
              anthropic.messages.create({
                model: modelName,
                max_tokens: 4096,
                // Use prompt caching for system prompt (90% cost savings on cache hits)
                system: [
                  {
                    type: 'text',
                    text: systemPrompt,
                    cache_control: { type: 'ephemeral' },
                  },
                ],
                messages: currentMessages,
                tools: tools.length > 0 ? tools : undefined,
                stream: true,
              }),
            {
              maxRetries: 3,
              initialDelayMs: 2000,
              maxDelayMs: 30000,
              onlyRateLimits: true,
              onRetry: (attempt, _error, delayMs) => {
                // Notify client of retry
                controller.enqueue(sseEvent(encoder, {
                  type: 'retry',
                  attempt,
                  delayMs,
                  message: `Rate limited, retrying in ${Math.ceil(delayMs / 1000)} seconds...`,
                }))
              },
            }
          )

          let fullText = ''
          const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = []
          let currentToolCall: { id: string; name: string; input: string; isServerTool?: boolean } | null = null

          for await (const event of response) {
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'tool_use') {
                currentToolCall = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: ''
                }
                // Send tool call start event (include id for matching)
                controller.enqueue(sseEvent(encoder, {
                  type: 'tool_call_start',
                  id: event.content_block.id,
                  tool: event.content_block.name,
                }))
              } else if (event.content_block.type === 'server_tool_use') {
                // Server tools (like web_search) are executed by Anthropic
                currentToolCall = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: '',
                  isServerTool: true
                }
                // Send server tool call start event (include id for matching)
                controller.enqueue(sseEvent(encoder, {
                  type: 'tool_call_start',
                  id: event.content_block.id,
                  tool: event.content_block.name,
                  isServerTool: true,
                }))
              } else if (event.content_block.type === 'web_search_tool_result') {
                // Server tool result - emit tool_result event for the web_search tool
                const resultBlock = event.content_block as unknown as { tool_use_id: string; content: unknown }
                const toolUseId = resultBlock.tool_use_id
                const originalInput = serverToolInputs.get(toolUseId)

                // Format the search results for display
                const formattedResult = formatWebSearchResults(resultBlock.content)

                controller.enqueue(sseEvent(encoder, {
                  type: 'tool_result',
                  id: toolUseId,
                  tool: 'web_search',
                  input: originalInput,
                  result: formattedResult,
                }))
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                fullText += event.delta.text
                // Stream text to client
                controller.enqueue(sseEvent(encoder, {
                  type: 'text',
                  content: event.delta.text,
                }))
              } else if (event.delta.type === 'input_json_delta' && currentToolCall) {
                currentToolCall.input += event.delta.partial_json
              }
            } else if (event.type === 'content_block_stop') {
              if (currentToolCall) {
                try {
                  const input = JSON.parse(currentToolCall.input)

                  // For server tools, stream the search query to the UI and store input for result matching
                  if (currentToolCall.isServerTool) {
                    // Store the input so we can emit tool_result when we get the result block
                    serverToolInputs.set(currentToolCall.id, input)

                    if (currentToolCall.name === 'web_search' && input.query) {
                      controller.enqueue(sseEvent(encoder, {
                        type: 'search_query',
                        query: input.query,
                      }))
                    }
                  }

                  // Only add to toolCalls if it's a custom tool (not server tool)
                  if (!currentToolCall.isServerTool) {
                    toolCalls.push({
                      id: currentToolCall.id,
                      name: currentToolCall.name,
                      input
                    })
                  }
                } catch {
                  // Invalid JSON, skip this tool call
                }
                currentToolCall = null
              }
            } else if (event.type === 'message_delta') {
              // Capture usage data from the message delta event
              const deltaUsage = (event as unknown as { usage?: AnthropicMessageDeltaUsage }).usage
              if (deltaUsage) {
                totalOutputTokens += deltaUsage.output_tokens || 0
              }
            } else if (event.type === 'message_start') {
              // Capture initial usage (input tokens, cache tokens)
              const startUsage = (event as unknown as { message?: { usage?: AnthropicMessageStartUsage } }).message?.usage
              if (startUsage) {
                totalInputTokens += startUsage.input_tokens || 0
                totalCacheCreationTokens += startUsage.cache_creation_input_tokens || 0
                totalCacheReadTokens += startUsage.cache_read_input_tokens || 0
              }
            } else if (event.type === 'message_stop') {
              // Message complete
            }
          }

          // Accumulate full text across iterations
          totalFullText += fullText

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

              try {
                // Skip server tools - they're executed automatically by Anthropic
                // Results come back as WebSearchToolResultBlock content blocks
                if (isServerTool(tc.name)) {
                  // Server tool results are handled by the API
                  // We just need to continue the loop without adding a tool_result
                  continue
                }

                // Check if it's a built-in tool (non-server)
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
                      // Determine model for skill execution
                      // Priority: skill.model_preference > role.model_preference > default
                      const skillModel = skill.model_preference?.split('/')[1]
                        || role.model_preference?.split('/')[1]
                        || 'claude-haiku-4-5'

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

                      // Generate unique ID for tracking this skill execution
                      const skillExecutionId = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

                      // Emit skill_start event (include toolId and toolName for matching in client)
                      controller.enqueue(sseEvent(encoder, {
                        type: 'skill_start',
                        skillId: skillExecutionId,
                        skillName: skill.name,
                        toolId: tc.id,
                        toolName: tc.name,
                        inputs: tc.input,
                        maxIterations: 5,
                      }))

                      // Agentic execution with nested tool loop and streaming progress
                      result = await executeSkillWithTools(skill, tc.input, {
                        anthropic,
                        model: skillModel,
                        availableTools: tools,
                        linkedLore,
                        executeToolCall,
                        // Legacy callback (still called by executeSkillWithTools)
                        onToolCall: (name, toolResult) => {
                          // Stream nested tool calls to client (legacy event for backwards compat)
                          controller.enqueue(sseEvent(encoder, {
                            type: 'skill_tool_call',
                            skill: skill.name,
                            tool: name,
                            result: toolResult.slice(0, 200),
                          }))
                        },
                        onServerToolCall: (name, input) => {
                          // Stream server tool calls (like web_search) to client
                          if (name === 'web_search' && input.query) {
                            controller.enqueue(sseEvent(encoder, {
                              type: 'search_query',
                              query: input.query,
                              skillId: skillExecutionId,
                            }))
                          }
                        },
                        // Streaming progress callbacks
                        onSkillStart: () => {
                          // Skill execution started (progress tracked via SSE events)
                        },
                        onIteration: (iteration, maxIterations) => {
                          controller.enqueue(sseEvent(encoder, {
                            type: 'skill_iteration',
                            skillId: skillExecutionId,
                            skillName: skill.name,
                            iteration,
                            maxIterations,
                          }))
                        },
                        onTextDelta: (text) => {
                          controller.enqueue(sseEvent(encoder, {
                            type: 'skill_text_delta',
                            skillId: skillExecutionId,
                            content: text,
                          }))
                        },
                        onToolCallStart: (toolId, toolName, iteration) => {
                          controller.enqueue(sseEvent(encoder, {
                            type: 'skill_tool_call_start',
                            skillId: skillExecutionId,
                            skillName: skill.name,
                            toolId,
                            toolName,
                            iteration,
                          }))
                        },
                        onToolResult: (toolId, toolName, input, toolResult, isError) => {
                          controller.enqueue(sseEvent(encoder, {
                            type: 'skill_tool_result',
                            skillId: skillExecutionId,
                            toolId,
                            toolName,
                            input,
                            result: toolResult.slice(0, 500),
                            isError,
                          }))
                        },
                        onComplete: (finalResult, totalIterations) => {
                          controller.enqueue(sseEvent(encoder, {
                            type: 'skill_complete',
                            skillId: skillExecutionId,
                            skillName: skill.name,
                            result: finalResult.slice(0, 500),
                            totalIterations,
                          }))
                        },
                        onError: (errorMsg, iteration) => {
                          controller.enqueue(sseEvent(encoder, {
                            type: 'skill_error',
                            skillId: skillExecutionId,
                            skillName: skill.name,
                            error: errorMsg,
                            iteration,
                          }))
                        }
                      })
                    } else {
                      // Simple skill - use shared helper for progress events
                      result = executeSimpleSkillWithEvents(
                        skill, tc.input, linkedLore, encoder, controller,
                        { toolId: tc.id, toolName: tc.name },
                      )
                    }
                  } else {
                    result = `Error: Unknown tool "${tc.name}"`
                  }
                }
              } catch (toolError) {
                console.error(`[Chat] Tool execution error for ${tc.name}:`, toolError)

                // Check if it's a rate limit from skill execution
                if (isRateLimitError(toolError)) {
                  const retryAfterSec = Math.ceil(getRetryAfterMs(toolError) / 1000)
                  result = `Error: ${ERROR_MESSAGES.RATE_LIMIT_WITH_RETRY(retryAfterSec)}`

                  // Send warning event to client
                  controller.enqueue(sseEvent(encoder, {
                    type: 'warning',
                    message: ERROR_MESSAGES.RATE_LIMIT_WITH_RETRY(retryAfterSec),
                  }))
                } else {
                  result = `Error executing tool: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`
                }
              }

              // Send tool result event (includes input for UI display)
              controller.enqueue(sseEvent(encoder, {
                type: 'tool_result',
                id: tc.id,
                tool: tc.name,
                input: tc.input,
                result,
              }))

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

        // Calculate and send usage/cost data
        const usage = {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          cacheCreationTokens: totalCacheCreationTokens,
          cacheReadTokens: totalCacheReadTokens,
        }
        const cost = calculateMessageCost(modelName, usage)
        controller.enqueue(sseEvent(encoder, {
          type: 'usage',
          ...usage,
          cost,
          formattedCost: formatCost(cost),
        }))

        // Persist assistant message with usage metadata server-side
        if (conversationId && totalFullText) {
          try {
            const { data: savedMsg } = await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                role: 'assistant',
                content: totalFullText,
                metadata: {
                  usage: { ...usage, cost },
                  model: modelName,
                  provider,
                },
              })
              .select('id')
              .single()

            if (savedMsg) {
              controller.enqueue(sseEvent(encoder, {
                type: 'message_saved',
                messageId: savedMsg.id,
              }))
            }
          } catch (saveError) {
            console.error('[Anthropic] Failed to persist assistant message:', saveError)
          }
        }

        // Send done event
        controller.enqueue(sseEvent(encoder, { type: 'done' }))
        controller.close()
      } catch (error) {
        console.error('Stream error:', error)

        // Send appropriate error event to client
        if (isRateLimitError(error)) {
          const retryAfterSec = Math.ceil(getRetryAfterMs(error) / 1000)
          controller.enqueue(sseEvent(encoder, {
            type: 'error',
            errorType: 'rate_limit',
            message: ERROR_MESSAGES.RATE_LIMIT_WITH_RETRY(retryAfterSec),
            retryAfterSeconds: retryAfterSec,
          }))
        } else {
          controller.enqueue(sseEvent(encoder, {
            type: 'error',
            message: ERROR_MESSAGES.UNKNOWN_ERROR,
          }))
        }
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
}
