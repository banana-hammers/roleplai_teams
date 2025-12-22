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

/**
 * SECURITY: Maximum length for input values to prevent DoS
 */
const MAX_INPUT_LENGTH = 100000

/**
 * Maximum iterations for agentic skill execution to prevent infinite loops
 */
const MAX_AGENTIC_ITERATIONS = 5

/**
 * SECURITY: Validate that a key is a safe placeholder name
 */
function isValidPlaceholderKey(key: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
}

/**
 * SECURITY: Sanitize input value for template interpolation
 */
function sanitizeTemplateInput(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  let str = String(value)

  if (str.length > MAX_INPUT_LENGTH) {
    str = str.slice(0, MAX_INPUT_LENGTH) + '... [truncated]'
  }

  return str
}

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
  availableTools: Anthropic.Tool[]
  linkedLore?: Lore[]
  executeToolCall: (name: string, input: Record<string, unknown>) => Promise<string>
  onToolCall?: (name: string, result: string) => void
}

/**
 * Execute a skill with tools (agentic mode).
 * Runs a nested agentic loop where the skill can call allowed tools.
 */
export async function executeSkillWithTools(
  skill: Skill,
  inputs: Record<string, unknown>,
  context: SkillExecutionContext
): Promise<string> {
  const { anthropic, availableTools, linkedLore, executeToolCall, onToolCall } = context

  // Filter tools to only those allowed by this skill
  const allowedTools = availableTools.filter(tool =>
    skill.allowed_tools?.some(allowed =>
      tool.name === allowed || tool.name.startsWith(allowed + '_')
    )
  )

  // Build skill-specific prompt with Level 2+3 context
  const skillPrompt = buildSkillPrompt(skill, inputs, linkedLore)

  // Initialize messages for nested agentic loop
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: skillPrompt
  }]

  // Run agentic loop
  for (let i = 0; i < MAX_AGENTIC_ITERATIONS; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages,
      tools: allowedTools.length > 0 ? allowedTools : undefined
    })

    // Extract text content
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('')

    // Extract tool calls
    const toolUseBlocks = response.content
      .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')

    // If no tool calls, we're done - return the text
    if (toolUseBlocks.length === 0) {
      return textContent
    }

    // Add assistant message with all content
    messages.push({
      role: 'assistant',
      content: response.content
    })

    // Execute each tool call and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUseBlocks) {
      try {
        const result = await executeToolCall(toolUse.name, toolUse.input as Record<string, unknown>)
        onToolCall?.(toolUse.name, result)

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `Error executing tool: ${errorMessage}`,
          is_error: true
        })
      }
    }

    // Add tool results as user message
    messages.push({
      role: 'user',
      content: toolResults
    })
  }

  // Reached max iterations
  return `[Skill "${skill.name}" reached maximum iterations (${MAX_AGENTIC_ITERATIONS})]`
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
