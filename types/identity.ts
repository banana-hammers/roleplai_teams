export interface IdentityCore {
  id: string
  user_id: string
  voice: string
  priorities: Record<string, any>
  boundaries: Record<string, any>
  decision_rules: Record<string, any>
  created_at: string
  updated_at: string
}

export type ContextPackType = 'bio' | 'brand' | 'rules' | 'custom'

export interface ContextPack {
  id: string
  user_id: string
  name: string
  content: string
  type: ContextPackType
  created_at: string
  updated_at: string
}
