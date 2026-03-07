import type { Skill } from '@/types/skill'
import type { GenericToolDefinition } from '@/lib/tools/types'

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
 * Convert skills to provider-agnostic tool format (for OpenAI path)
 */
export function skillsToGenericTools(skills: Skill[]): GenericToolDefinition[] {
  return skills.map(skill => {
    const schema = ensureValidSchema(skill.input_schema)
    return {
      name: skill.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      description: skill.short_description
        || (skill.description
            ? skill.description.slice(0, 150) + (skill.description.length > 150 ? '...' : '')
            : 'Execute this skill'),
      parameters: {
        type: 'object' as const,
        properties: (schema.properties || {}) as Record<string, unknown>,
        required: schema.required as string[] | undefined,
      },
    }
  })
}

/**
 * Find a skill by its tool name (the sanitized version used in API calls)
 */
export function findSkillByToolName(skills: Skill[], toolName: string): Skill | undefined {
  return skills.find(skill =>
    skill.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') === toolName
  )
}

