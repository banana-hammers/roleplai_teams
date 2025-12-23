import type { Skill } from '@/types/skill'

// Anthropic tool type (simplified - matches API spec)
export interface AnthropicTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

/**
 * Default schema for skills without a valid input_schema.
 * Anthropic requires at least { type: 'object' } for tool schemas.
 */
const DEFAULT_INPUT_SCHEMA = {
  type: 'object' as const,
  properties: {},
}

/**
 * Ensure input_schema has the required 'type' field.
 * Anthropic API returns 400 if input_schema.type is missing.
 */
function ensureValidSchema(schema: Record<string, unknown>): Record<string, unknown> {
  if (!schema || typeof schema !== 'object' || !schema.type) {
    return { ...DEFAULT_INPUT_SCHEMA, ...schema }
  }
  return schema
}

/**
 * Convert database skills to Anthropic API tool format.
 * JSON Schema from skill.input_schema works directly - no conversion needed!
 */
export function skillsToAnthropicTools(skills: Skill[]): AnthropicTool[] {
  return skills.map(skill => ({
    // Tool names must be alphanumeric with underscores
    name: skill.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    // Prefer short_description for tool triggering decisions
    // Fall back to truncated description if short_description is not set
    description: skill.short_description
      || (skill.description
          ? skill.description.slice(0, 150) + (skill.description.length > 150 ? '...' : '')
          : 'Execute this skill'),
    input_schema: ensureValidSchema(skill.input_schema)
  }))
}

/**
 * Find a skill by its tool name (the sanitized version used in API calls)
 */
export function findSkillByToolName(skills: Skill[], toolName: string): Skill | undefined {
  return skills.find(skill =>
    skill.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') === toolName
  )
}

/**
 * SECURITY: Maximum length for input values to prevent DoS
 */
const MAX_INPUT_LENGTH = 100000

/**
 * SECURITY: Sanitize input value for template interpolation
 * - Enforces length limits
 * - Escapes potentially dangerous patterns
 */
function sanitizeTemplateInput(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  let str = String(value)

  // Enforce length limit
  if (str.length > MAX_INPUT_LENGTH) {
    str = str.slice(0, MAX_INPUT_LENGTH) + '... [truncated]'
  }

  return str
}

/**
 * SECURITY: Validate that a key is a safe placeholder name
 */
function isValidPlaceholderKey(key: string): boolean {
  // Only allow alphanumeric and underscore
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
}

/**
 * Execute a skill by interpolating inputs into the prompt template.
 * Replaces {{placeholder}} with actual values.
 * SECURITY: Sanitizes inputs and validates placeholder keys
 */
export function executeSkillTool(
  skill: Skill,
  inputs: Record<string, unknown>
): string {
  let output = skill.prompt_template

  for (const [key, value] of Object.entries(inputs)) {
    // SECURITY: Validate placeholder key to prevent regex injection
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
