export interface Skill {
  id: string
  user_id: string
  role_id: string | null
  name: string
  description: string
  prompt_template: string
  input_schema: Record<string, any>
  tool_constraints: Record<string, any>
  version: number
  created_at: string
  updated_at: string
  // Progressive disclosure fields
  short_description: string | null  // Level 1: Brief description for system prompt
  detailed_instructions: string | null  // Level 2: Rich guidance loaded on invocation
  examples: SkillExample[]  // Level 2: Input/output examples
  linked_lore_ids: string[]  // Level 3: Lore IDs to inject as context
  allowed_tools: string[]  // Tools this skill can call
}

export interface SkillExample {
  input: string
  output: string
}
