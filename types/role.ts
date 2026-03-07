export type ApprovalPolicy = 'always' | 'never' | 'smart'

export interface Role {
  id: string
  user_id: string
  name: string
  description: string
  instructions: string
  identity_facets: Record<string, any>
  approval_policy: ApprovalPolicy
  model_preference: string | null
  created_at: string
  updated_at: string
}

/**
 * Resolved skill data for display (joined from skills table)
 */
export interface ResolvedSkill {
  id: string
  name: string
  description: string | null
  short_description: string | null  // Level 1: Brief description for system prompt
}

/**
 * Role with resolved skill information, lore count, and identity context
 * Used for the enhanced RoleCard display
 */
export interface RoleWithSkills extends Role {
  resolved_skills: ResolvedSkill[]
  lore_count: number
  identity_voice?: string | null  // User's identity core voice for display
}
