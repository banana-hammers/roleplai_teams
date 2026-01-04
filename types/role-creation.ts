import { z } from 'zod'

// Extracted role configuration from interview
export const roleConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  instructions: z.string().min(1),
  identity_facets: z.object({
    tone_adjustment: z.string().optional(),
    priority_override: z.array(z.string()).optional(),
    special_behaviors: z.array(z.string()).optional(),
  }),
  approval_policy: z.enum(['always', 'never', 'smart']).default('smart'),
})

export type ExtractedRoleConfig = z.infer<typeof roleConfigSchema>

// Extracted skill from interview
export const extractedSkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  prompt_template: z.string().min(1),
  input_schema: z.object({
    type: z.literal('object'),
    properties: z.record(z.string(), z.object({
      type: z.string(),
      description: z.string().optional(),
      enum: z.array(z.string()).optional(),
    })),
    required: z.array(z.string()).optional(),
  }),
  examples: z.array(z.object({
    input: z.record(z.string(), z.unknown()),
    expected_output: z.string(),
  })).optional(),
})

export type ExtractedSkill = z.infer<typeof extractedSkillSchema>

// Full extraction result
export const extractionResultSchema = z.object({
  role: roleConfigSchema,
  skills: z.array(extractedSkillSchema).max(4).default([]),
})

export type ExtractionResult = z.infer<typeof extractionResultSchema>

// Role creation local state (for localStorage)
export interface RoleCreationLocalState {
  currentStep: number // 1-3
  interviewMessages?: Array<{ role: string; content: string }>
  extractedConfig?: ExtractionResult
  selectedSkillIds?: string[] // indices of selected skills (as strings for JSON compat)
  editedRole?: Partial<ExtractedRoleConfig>
  createdRoleId?: string
}

// Create role request
export interface CreateRoleData {
  role: ExtractedRoleConfig
  skills: ExtractedSkill[]
  selectedSkillIndices: number[]
}

// Create role result
export interface CreateRoleResult {
  success: boolean
  roleId?: string
  skillIds?: string[]
  error?: string
}
