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

export interface RoleLore {
  role_id: string
  lore_id: string
}

export interface RoleSkill {
  role_id: string
  skill_id: string
  config_overrides: Record<string, any>
  created_at: string
}

/**
 * Resolved skill data for display (joined from skills table)
 */
export interface ResolvedSkill {
  id: string
  name: string
  description: string | null
}

/**
 * Role with resolved skill information and lore count
 * Used for the enhanced RoleCard display
 */
export interface RoleWithSkills extends Role {
  resolved_skills: ResolvedSkill[]
  lore_count: number
}
