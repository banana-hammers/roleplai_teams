import { z } from 'zod'
import type { SkillExample } from '@/types/skill'

// Re-export for convenience
export type { SkillExample }

// Mode for skill creation/editing via Forge
export type SkillInterviewMode = 'create' | 'edit'

// Example format for skill examples
export const skillExampleSchema = z.object({
  input: z.string().describe('Example input values as a description or JSON'),
  output: z.string().describe('Expected output for this input'),
})

// Extracted skill from Forge conversation (includes progressive disclosure fields)
export const forgeExtractedSkillSchema = z.object({
  name: z.string().min(1).max(100).describe('Action name, e.g., "Draft Email"'),
  short_description: z.string().max(100).describe('Brief description for system prompt, ~50 chars'),
  description: z.string().min(1).max(500).describe('Full description of what the skill does'),
  prompt_template: z.string().min(1).describe('The prompt template with {{placeholders}} for inputs'),
  detailed_instructions: z.string().optional().describe('Rich guidance loaded when skill is invoked'),
  allowed_tools: z.array(z.string()).default([]).describe('Tools this skill can use: web_search, web_fetch, or MCP tool names'),
  examples: z.array(skillExampleSchema).default([]).describe('Input/output examples to guide skill behavior'),
})

export type ForgeExtractedSkill = z.infer<typeof forgeExtractedSkillSchema>

// Existing skill data passed to edit mode
export interface ExistingSkillContext {
  id: string
  name: string
  description: string
  prompt_template: string
  short_description?: string | null
  detailed_instructions?: string | null
  allowed_tools?: string[]
  examples?: SkillExample[]
  model_preference?: string | null
}

// Context for Forge skill interview
export interface ForgeSkillContext {
  mode: SkillInterviewMode
  roleId: string
  roleName?: string
  existingSkill?: ExistingSkillContext
  availableTools?: string[] // Including MCP tools for the role
}

// Interview request body
export interface SkillInterviewRequest {
  messages: Array<{ role: string; content: string }>
  mode: SkillInterviewMode
  roleId: string
  existingSkill?: ExistingSkillContext
}

// Extraction request body
export interface SkillExtractionRequest {
  messages: Array<{ role: string; content: string }>
  mode: SkillInterviewMode
  existingSkill?: ExistingSkillContext
}

// Extraction result
export interface SkillExtractionResult {
  success: boolean
  skill?: ForgeExtractedSkill
  error?: string
}
