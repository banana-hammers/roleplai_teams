import type { Skill } from '@/types/skill'

// Anthropic tool type (simplified - matches API spec)
export interface AnthropicTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

/**
 * Convert database skills to Anthropic API tool format.
 * JSON Schema from skill.input_schema works directly - no conversion needed!
 */
export function skillsToAnthropicTools(skills: Skill[]): AnthropicTool[] {
  return skills.map(skill => ({
    // Tool names must be alphanumeric with underscores
    name: skill.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    description: skill.description,
    input_schema: skill.input_schema
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
 * Execute a skill by interpolating inputs into the prompt template.
 * Replaces {{placeholder}} with actual values.
 */
export function executeSkillTool(
  skill: Skill,
  inputs: Record<string, unknown>
): string {
  let output = skill.prompt_template

  for (const [key, value] of Object.entries(inputs)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    output = output.replace(placeholder, String(value ?? ''))
  }

  return output
}
