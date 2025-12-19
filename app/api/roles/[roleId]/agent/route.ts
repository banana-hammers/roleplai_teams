import { createClient } from '@/lib/supabase/server'
import { query, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import { skillToMarkdown } from '@/lib/skills/skill-to-markdown'
import { resolveAllowedTools, mapApprovalPolicy } from '@/lib/agent/tool-permissions'
import { createTaskRecordingHooks } from '@/lib/agent/task-recording-hooks'
import { resolveMcpServers } from '@/lib/agent/mcp-resolver'
import { decryptApiKey, isEncryptionConfigured } from '@/lib/crypto/api-key-encryption'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'
import type { Skill } from '@/types/skill'

// SDK requires Node.js runtime (spawns Claude Code as child process)
// Do NOT use Edge Runtime here
export const runtime = 'nodejs'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  // Parse request data first (fast)
  const { roleId } = await params
  const { messages, conversationId, resumeSessionId } = await req.json()
  const userMessage = messages[messages.length - 1]?.content || ''

  // Quick auth check - required for proper HTTP status codes
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // SECURITY: Rate limit by user ID (agent is more expensive)
  const rateLimitResult = await rateLimit(
    `agent:${user.id}`,
    RATE_LIMITS.agent.limit,
    RATE_LIMITS.agent.windowMs
  )

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  // Return streaming response immediately to prevent Vercel 25s timeout
  // All heavy lifting (DB queries, SDK init) happens inside the stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send immediate heartbeat - this is what prevents the timeout
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`))

        // Now do the heavy database fetching inside the stream
        // Fetch the role and verify ownership
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .eq('id', roleId)
          .eq('user_id', user.id)
          .single()

        if (roleError || !role) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Role not found'
          })}\n\n`))
          controller.close()
          return
        }

        // Fetch all related data in parallel for better performance
        const [identityCoreResult, contextPacksResult, roleSkillsResult, apiKeysResult] = await Promise.all([
          supabase
            .from('identity_cores')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('role_context_packs')
            .select(`
              context_pack_id,
              context_packs (
                name,
                content,
                type
              )
            `)
            .eq('role_id', roleId),
          supabase
            .from('role_skills')
            .select(`
              skill_id,
              config_overrides,
              skills (*)
            `)
            .eq('role_id', roleId),
          supabase
            .from('user_api_keys')
            .select('encrypted_key')
            .eq('user_id', user.id)
            .eq('provider', 'anthropic')
            .maybeSingle()
        ])

        const identityCore = identityCoreResult.data
        const contextPacks = contextPacksResult.data
        const roleSkills = roleSkillsResult.data
        const apiKeys = apiKeysResult.data

        // Build the system prompt with identity + role + context + skills
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

        // Add context packs
        if (contextPacks && contextPacks.length > 0) {
          systemPromptParts.push('# Context Packs')
          contextPacks.forEach((cp: any) => {
            const pack = cp.context_packs
            if (pack) {
              systemPromptParts.push(`\n## ${pack.name} (${pack.type})
${pack.content}`)
            }
          })
        }

        // Add skills in SKILL.md format for progressive disclosure
        if (roleSkills && roleSkills.length > 0) {
          systemPromptParts.push('# Available Skills')
          systemPromptParts.push('You have access to the following skills. Use them when appropriate:\n')
          roleSkills.forEach((rs: any) => {
            const skill = rs.skills as Skill
            if (skill) {
              const overrides = rs.config_overrides || {}
              systemPromptParts.push(skillToMarkdown({ ...skill, ...overrides }))
            }
          })
        }

        const systemPrompt = systemPromptParts.join('\n\n---\n\n')

        // Get API key (fall back to system key)
        let apiKey: string | undefined

        // Decrypt user's API key if available and encryption is configured
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'No API key available. Please add your own API key in settings.'
          })}\n\n`))
          controller.close()
          return
        }

        // Get model from role preference or use default
        const modelName = role.model_preference?.split('/')[1] || 'claude-sonnet-4-5-20250929'

        // Create task recording hooks
        const taskHooks = createTaskRecordingHooks({
          userId: user.id,
          roleId,
          conversationId
        })

        // Resolve MCP servers for this user/role
        const mcpServers = await resolveMcpServers(user.id, roleId)

        // Resolve allowed tools based on role configuration
        const allowedTools = resolveAllowedTools(role)

        // Configure SDK options
        // SECURITY: Pass API key via env option to avoid process.env mutation race conditions
        const options: Options = {
          model: modelName,
          systemPrompt,
          allowedTools,
          // SECURITY: Pass allowedTools to force safer mode if dangerous tools present
          permissionMode: mapApprovalPolicy(role.approval_policy, allowedTools),
          hooks: taskHooks.hooks,
          mcpServers: Object.keys(mcpServers).length > 0 ? mcpServers : undefined,
          includePartialMessages: true,
          // Pass API key safely via env option (isolated per-request)
          env: {
            ...process.env,
            ANTHROPIC_API_KEY: apiKey,
          },
          // Resume from previous session if provided
          ...(resumeSessionId ? { resume: resumeSessionId } : {}),
        }

        // Run the agent query
        for await (const message of query({ prompt: userMessage, options })) {
          handleSdkMessage(message, controller, encoder, supabase, conversationId)
        }

        // Send done event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
        controller.close()
      } catch (error) {
        console.error('Agent stream error:', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'An error occurred'
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
}

/**
 * Handle SDK message and stream to client
 */
async function handleSdkMessage(
  message: SDKMessage,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  supabase: any,
  conversationId?: string
) {
  switch (message.type) {
    case 'assistant': {
      // Stream assistant message content
      const content = message.message.content
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'text',
              content: block.text
            })}\n\n`))
          } else if (block.type === 'tool_use') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'tool_call_start',
              tool: block.name,
              id: block.id,
              input: block.input
            })}\n\n`))
          }
        }
      }
      break
    }

    case 'user': {
      // User messages may contain tool results
      const content = message.message.content
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'tool_result') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'tool_result',
              id: block.tool_use_id,
              result: typeof block.content === 'string'
                ? block.content
                : JSON.stringify(block.content)
            })}\n\n`))
          }
        }
      }
      break
    }

    case 'stream_event': {
      // Partial/streaming events
      const event = message.event
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'text_delta',
            content: event.delta.text
          })}\n\n`))
        }
      }
      break
    }

    case 'result': {
      // Final result with usage stats
      if (message.subtype === 'success') {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'result',
          result: message.result,
          usage: message.usage,
          cost_usd: message.total_cost_usd
        })}\n\n`))
      } else {
        // Error result
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          message: 'errors' in message ? message.errors.join(', ') : 'Query failed'
        })}\n\n`))
      }
      break
    }

    case 'system': {
      if (message.subtype === 'init') {
        // Capture session ID for resume support
        const sessionId = message.session_id
        if (sessionId && conversationId) {
          await supabase
            .from('conversations')
            .update({ sdk_session_id: sessionId })
            .eq('id', conversationId)
        }
        // Send init info to client
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'init',
          session_id: sessionId,
          model: message.model,
          tools: message.tools
        })}\n\n`))
      }
      break
    }

    case 'tool_progress': {
      // Tool execution progress
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'tool_progress',
        tool: message.tool_name,
        id: message.tool_use_id,
        elapsed: message.elapsed_time_seconds
      })}\n\n`))
      break
    }
  }
}
