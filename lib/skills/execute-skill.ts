/**
 * Skill Execution Module
 *
 * Handles both simple and agentic skill execution with progressive disclosure.
 * - Simple skills: Just interpolate template and return
 * - Agentic skills: Run nested agentic loop with allowed tools
 */

import type Anthropic from '@anthropic-ai/sdk'
import type { Skill, SkillExample } from '@/types/skill'
import type { Lore } from '@/types/identity'
import { withRetry } from '@/lib/errors/retry'
import { isRateLimitError, RateLimitError, ERROR_MESSAGES } from '@/lib/errors/api-errors'
import { isServerTool } from '@/lib/tools/builtin-tools'
import { isValidPlaceholderKey, sanitizeTemplateInput } from '@/lib/skills/template-utils'

/**
 * Maximum iterations for agentic skill execution to prevent infinite loops
 */
const MAX_AGENTIC_ITERATIONS = 5

/**
 * Interpolate inputs into a prompt template.
 * Replaces {{placeholder}} with actual values.
 */
export function interpolateTemplate(
  template: string,
  inputs: Record<string, unknown>
): string {
  let output = template

  for (const [key, value] of Object.entries(inputs)) {
    if (!isValidPlaceholderKey(key)) {
      console.warn(`SECURITY: Skipping invalid placeholder key: ${key}`)
      continue
    }

    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    const sanitizedValue = sanitizeTemplateInput(value)
    output = output.replace(placeholder, sanitizedValue)
  }

  return output
}

/**
 * Build skill prompt with Level 2+3 context for agentic execution
 */
function buildSkillPrompt(
  skill: Skill,
  inputs: Record<string, unknown>,
  linkedLore?: Lore[]
): string {
  const parts: string[] = []

  // Level 2: Detailed instructions
  if (skill.detailed_instructions) {
    parts.push(`<instructions>\n${skill.detailed_instructions}\n</instructions>`)
  }

  // Level 2: Examples for few-shot learning
  if (skill.examples?.length > 0) {
    const exampleText = skill.examples.map((ex: SkillExample) =>
      `Input: ${ex.input}\nOutput: ${ex.output}`
    ).join('\n---\n')
    parts.push(`<examples>\n${exampleText}\n</examples>`)
  }

  // Level 3: Linked lore for domain knowledge
  if (linkedLore?.length) {
    const loreText = linkedLore.map(l => `## ${l.name}\n${l.content}`).join('\n\n')
    parts.push(`<context>\n${loreText}\n</context>`)
  }

  // The interpolated template as the task
  const task = interpolateTemplate(skill.prompt_template, inputs)
  parts.push(`<task>\n${task}\n</task>`)

  return parts.join('\n\n')
}

/**
 * Context for agentic skill execution
 */
export interface SkillExecutionContext {
  anthropic: Anthropic
  /** Model to use for skill execution (e.g., 'claude-haiku-4-5') */
  model: string
  /** Mixed array of custom tools (Tool) and server tools (WebSearchTool20250305) */
  availableTools: Anthropic.ToolUnion[]
  linkedLore?: Lore[]
  /** Execute a custom tool (not called for server tools which run automatically) */
  executeToolCall: (name: string, input: Record<string, unknown>) => Promise<string>
  /** Called when a custom tool is executed with its result */
  onToolCall?: (name: string, result: string) => void
  /** Called when a server tool (like web_search) is detected in the response */
  onServerToolCall?: (name: string, input: Record<string, unknown>) => void

  // Streaming progress callbacks for UI feedback
  /** Called when skill execution starts */
  onSkillStart?: (skillId: string) => void
  /** Called at the start of each agentic iteration */
  onIteration?: (iteration: number, maxIterations: number) => void
  /** Called when text is streamed from the skill's response */
  onTextDelta?: (text: string) => void
  /** Called when a tool call starts within the skill */
  onToolCallStart?: (toolId: string, toolName: string, iteration: number) => void
  /** Called when a tool call completes within the skill */
  onToolResult?: (toolId: string, toolName: string, input: Record<string, unknown>, result: string, isError: boolean) => void
  /** Called when skill execution completes successfully */
  onComplete?: (result: string, totalIterations: number) => void
  /** Called when skill execution encounters an error */
  onError?: (error: string, iteration: number) => void
}

/**
 * Execute a skill with tools (agentic mode).
 * Runs a nested agentic loop where the skill can call allowed tools.
 * Now uses streaming for real-time progress updates.
 */
export async function executeSkillWithTools(
  skill: Skill,
  inputs: Record<string, unknown>,
  context: SkillExecutionContext
): Promise<string> {
  const {
    anthropic, model, availableTools, linkedLore, executeToolCall,
    onToolCall, onServerToolCall,
    // Streaming callbacks
    onSkillStart, onIteration, onTextDelta, onToolCallStart, onToolResult, onComplete, onError
  } = context

  // Generate unique skill execution ID for tracking
  const skillId = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  // Notify that skill execution is starting
  onSkillStart?.(skillId)

  // Filter tools to only those allowed by this skill
  // Works with both custom tools (Tool) and server tools (WebSearchTool20250305)
  // Both have a `name` property we can filter on
  const allowedTools = availableTools.filter(tool => {
    const toolName = tool.name
    return skill.allowed_tools?.some(allowed =>
      toolName === allowed || toolName.startsWith(allowed + '_')
    )
  })

  // Build skill-specific prompt with Level 2+3 context
  const skillPrompt = buildSkillPrompt(skill, inputs, linkedLore)

  // Initialize messages for nested agentic loop
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: skillPrompt
  }]

  // Run agentic loop with streaming
  for (let i = 0; i < MAX_AGENTIC_ITERATIONS; i++) {
    const iteration = i + 1

    // Notify iteration start
    onIteration?.(iteration, MAX_AGENTIC_ITERATIONS)

    try {
      // Use streaming API for real-time progress
      const stream = await withRetry(
        () =>
          anthropic.messages.create({
            model,
            max_tokens: 2048,
            messages,
            tools: allowedTools.length > 0 ? allowedTools : undefined,
            stream: true, // Enable streaming
          }),
        {
          maxRetries: 3,
          initialDelayMs: 2000,
          maxDelayMs: 30000,
          onlyRateLimits: true,
          onRetry: (attempt, error, delayMs) => {
            console.log(
              `[Skill ${skill.name}] Rate limit hit, retry ${attempt} in ${Math.round(delayMs / 1000)}s`
            )
          },
        }
      ).catch((error) => {
        // Convert exhausted rate limit retries to friendly error
        if (isRateLimitError(error)) {
          throw new RateLimitError(ERROR_MESSAGES.RATE_LIMIT, 60000, 'anthropic')
        }
        throw error
      })

      // Process streaming events
      let fullText = ''
      const toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = []
      let currentToolInput = ''
      let currentToolId: string | null = null
      let currentToolName: string | null = null
      let stopReason: string | null = null
      // Use ContentBlockParam for building message content (more flexible than ContentBlock)
      const contentBlocks: Anthropic.ContentBlockParam[] = []

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          const block = event.content_block
          if (block.type === 'text') {
            // Text block starting - nothing to do yet
          } else if (block.type === 'tool_use') {
            currentToolId = block.id
            currentToolName = block.name
            currentToolInput = ''
            // Notify tool call start (for custom tools)
            if (!isServerTool(block.name)) {
              onToolCallStart?.(block.id, block.name, iteration)
            }
          } else if (block.type === 'server_tool_use') {
            // Server tool (like web_search) - notify caller and track in progress
            const serverBlock = block as { type: 'server_tool_use'; name: string; id: string; input?: unknown }
            onServerToolCall?.(serverBlock.name, (serverBlock.input || {}) as Record<string, unknown>)
            // Also emit tool call start for server tools so they appear in skill progress
            onToolCallStart?.(serverBlock.id, serverBlock.name, iteration)
          }
        } else if (event.type === 'content_block_delta') {
          const delta = event.delta
          if (delta.type === 'text_delta') {
            fullText += delta.text
            onTextDelta?.(delta.text)
          } else if (delta.type === 'input_json_delta') {
            currentToolInput += delta.partial_json
          }
        } else if (event.type === 'content_block_stop') {
          // Finalize tool use block
          if (currentToolId && currentToolName && currentToolInput) {
            try {
              const parsedInput = JSON.parse(currentToolInput)
              if (!isServerTool(currentToolName)) {
                toolUseBlocks.push({
                  id: currentToolId,
                  name: currentToolName,
                  input: parsedInput
                })
              }
              // Add to content blocks for message history
              contentBlocks.push({
                type: 'tool_use',
                id: currentToolId,
                name: currentToolName,
                input: parsedInput
              })
            } catch {
              // Invalid JSON - skip this tool
              console.warn(`[Skill ${skill.name}] Failed to parse tool input JSON`)
            }
          } else if (fullText && !currentToolId) {
            // Text block completed
            contentBlocks.push({
              type: 'text',
              text: fullText
            })
          }
          currentToolId = null
          currentToolName = null
          currentToolInput = ''
        } else if (event.type === 'message_delta') {
          stopReason = event.delta.stop_reason || null
        }
      }

      // If no custom tool calls or end_turn, we're done
      if (toolUseBlocks.length === 0 || stopReason === 'end_turn') {
        onComplete?.(fullText, iteration)
        return fullText
      }

      // Add assistant message with all content blocks
      messages.push({
        role: 'assistant',
        content: contentBlocks
      })

      // Execute each tool call and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUseBlocks) {
        try {
          const result = await executeToolCall(toolUse.name, toolUse.input)
          onToolCall?.(toolUse.name, result)
          onToolResult?.(toolUse.id, toolUse.name, toolUse.input, result, false)

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          onToolResult?.(toolUse.id, toolUse.name, toolUse.input, errorMessage, true)

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error executing tool: ${errorMessage}`,
            is_error: true
          })
        }
      }

      // Add tool results as user message
      if (toolResults.length > 0) {
        messages.push({
          role: 'user',
          content: toolResults
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      onError?.(errorMessage, iteration)
      throw error
    }
  }

  // Reached max iterations
  const maxIterMsg = `[Skill "${skill.name}" reached maximum iterations (${MAX_AGENTIC_ITERATIONS})]`
  onComplete?.(maxIterMsg, MAX_AGENTIC_ITERATIONS)
  return maxIterMsg
}

/**
 * Execute a skill (simple mode).
 * Just interpolates the template and returns with optional Level 2+3 context.
 */
export function executeSkillSimple(
  skill: Skill,
  inputs: Record<string, unknown>,
  linkedLore?: Lore[]
): string {
  const parts: string[] = []

  // Level 2: Detailed instructions
  if (skill.detailed_instructions) {
    parts.push(`<instructions>\n${skill.detailed_instructions}\n</instructions>`)
  }

  // Level 2: Examples
  if (skill.examples?.length > 0) {
    const exampleText = skill.examples.map((ex: SkillExample) =>
      `Input: ${ex.input}\nOutput: ${ex.output}`
    ).join('\n---\n')
    parts.push(`<examples>\n${exampleText}\n</examples>`)
  }

  // Level 3: Linked lore
  if (linkedLore?.length) {
    const loreText = linkedLore.map(l => `## ${l.name}\n${l.content}`).join('\n\n')
    parts.push(`<context>\n${loreText}\n</context>`)
  }

  // Interpolated template result
  const result = interpolateTemplate(skill.prompt_template, inputs)
  parts.push(result)

  return parts.join('\n\n')
}
