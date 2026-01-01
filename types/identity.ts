export interface IdentityCore {
  id: string
  user_id: string
  voice: string
  priorities: string[] // Ordered array of top 3 priority values
  boundaries: Record<string, boolean | string[]> // Boolean flags + custom array
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
