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
}
