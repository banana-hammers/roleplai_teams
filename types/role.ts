export type ApprovalPolicy = 'always' | 'never' | 'smart'

export interface Role {
  id: string
  user_id: string
  name: string
  description: string
  instructions: string
  identity_facets: Record<string, any>
  allowed_tools: string[]
  approval_policy: ApprovalPolicy
  model_preference: string | null
  created_at: string
  updated_at: string
}

export interface RoleContextPack {
  role_id: string
  context_pack_id: string
}
