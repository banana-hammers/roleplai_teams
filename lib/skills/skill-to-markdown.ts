import type { Skill } from '@/types/skill'

interface SkillMarkdownOptions {
  // Reserved for future use
}

/**
 * Convert a database skill to SKILL.md format.
 *
 * Structure:
 * - YAML frontmatter (name, description, version, tool-constraints)
 * - Instructions section (prompt_template)
 * - Input parameters documentation
 */
export function skillToMarkdown(
  skill: Skill,
  _options: SkillMarkdownOptions = {}
): string {

  // Build YAML frontmatter
  const frontmatter = [
    '---',
    `name: ${sanitizeYaml(skill.name)}`,
    `description: ${sanitizeYaml(skill.description)}`,
    `version: ${skill.version}`,
  ]

  // Add tool constraints if present
  if (skill.tool_constraints && Object.keys(skill.tool_constraints).length > 0) {
    frontmatter.push('tool-constraints:')
    for (const [key, value] of Object.entries(skill.tool_constraints)) {
      frontmatter.push(`  ${key}: ${JSON.stringify(value)}`)
    }
  }

  frontmatter.push('---')

  // Build content with progressive disclosure
  const content: string[] = [
    '',
    `# ${skill.name}`,
    '',
    skill.description,
    '',
    '## Instructions',
    '',
    skill.prompt_template,
  ]

  // Add input schema documentation
  if (skill.input_schema && Object.keys(skill.input_schema).length > 0) {
    content.push('', '## Input Parameters', '')
    const schema = skill.input_schema as {
      properties?: Record<string, any>
      required?: string[]
    }
    if (schema.properties) {
      for (const [name, prop] of Object.entries(schema.properties)) {
        const required = schema.required?.includes(name) ? ' *(required)*' : ''
        const description = prop.description || prop.type || 'any'
        content.push(`- **${name}**${required}: ${description}`)
      }
    }
  }

  return frontmatter.join('\n') + content.join('\n')
}

/**
 * Sanitize a string for use in YAML frontmatter
 */
function sanitizeYaml(str: string): string {
  // If string contains special characters, wrap in quotes
  if (/[:\{\}\[\],&*#?|\-<>=!%@`]/.test(str) || str.includes('\n')) {
    return `"${str.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
  }
  return str
}

/**
 * Parse SKILL.md format back to skill properties (for importing)
 */
export function parseSkillMarkdown(markdown: string): Partial<Skill> {
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    return { prompt_template: markdown }
  }

  const frontmatter = frontmatterMatch[1]
  const content = markdown.slice(frontmatterMatch[0].length).trim()

  // Parse YAML frontmatter (simple parser)
  const result: Partial<Skill> = {}
  const lines = frontmatter.split('\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    switch (key) {
      case 'name':
        result.name = value
        break
      case 'description':
        result.description = value
        break
      case 'version':
        result.version = parseInt(value, 10) || 1
        break
    }
  }

  // Extract instructions from content
  const instructionsMatch = content.match(/## Instructions\n\n([\s\S]*?)(?=\n## |$)/)
  if (instructionsMatch) {
    result.prompt_template = instructionsMatch[1].trim()
  }

  return result
}
