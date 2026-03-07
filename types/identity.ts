export interface StyleProfile {
  sentence_length?: 'short' | 'medium' | 'long' | 'varied'
  vocabulary_level?: 'simple' | 'moderate' | 'advanced' | 'technical'
  formality?: 'casual' | 'balanced' | 'formal' | 'professional'
  punctuation_habits?: string[]
  formatting_prefs?: string[]
  signature_phrases?: string[]
  tone_markers?: string[]
}

export interface CognitiveStyle {
  decision_approach?: 'intuitive' | 'analytical' | 'collaborative' | 'decisive'
  uncertainty_response?: 'explore' | 'research' | 'ask_others' | 'make_best_guess'
  explanation_preference?: 'big_picture_first' | 'details_first' | 'examples_first' | 'analogies'
  feedback_style?: 'direct' | 'sandwich' | 'questions' | 'supportive'
  context_need?: 'minimal' | 'moderate' | 'comprehensive'
}

export interface RefinementEntry {
  timestamp: string
  correction: string
  field_updates: Record<string, unknown>
  source: 'chat_feedback' | 'settings' | 'auto_analysis'
}

export interface IdentityCore {
  id: string
  user_id: string
  voice: string
  priorities: string[] // Ordered array of top 3 priority values
  boundaries: Record<string, boolean | string[]> // Boolean flags + custom array
  style_profile?: StyleProfile
  cognitive_style?: CognitiveStyle
  writing_samples?: string[]
  refinement_log?: RefinementEntry[]
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
