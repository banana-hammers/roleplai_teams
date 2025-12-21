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

export type LoreType = 'bio' | 'brand' | 'rules' | 'custom'

export interface Lore {
  id: string
  user_id: string
  name: string
  content: string
  type: LoreType
  created_at: string
  updated_at: string
}
