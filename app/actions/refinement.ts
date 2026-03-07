'use server'

import { requireAuth } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import type { RefinementEntry, StyleProfile, CognitiveStyle } from '@/types/identity'

export interface SubmitRefinementData {
  correction: string
  field_updates: Record<string, unknown>
  source: 'chat_feedback' | 'settings' | 'auto_analysis'
}

export interface SubmitRefinementResult {
  success: boolean
  error?: string
}

const MAX_REFINEMENT_LOG = 50

export async function submitRefinement(
  data: SubmitRefinementData
): Promise<SubmitRefinementResult> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  try {
    // Fetch current identity core
    const { data: identity, error: fetchError } = await supabase
      .from('identity_cores')
      .select('style_profile, cognitive_style, refinement_log')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !identity) {
      return { success: false, error: 'Identity core not found' }
    }

    // Build new refinement entry
    const entry: RefinementEntry = {
      timestamp: new Date().toISOString(),
      correction: data.correction,
      field_updates: data.field_updates,
      source: data.source,
    }

    // Append to refinement log (FIFO, cap at MAX_REFINEMENT_LOG)
    const existingLog = (identity.refinement_log as RefinementEntry[] | null) || []
    const newLog = [...existingLog, entry].slice(-MAX_REFINEMENT_LOG)

    // Shallow-merge field_updates into style_profile and cognitive_style
    const currentStyle = (identity.style_profile as StyleProfile | null) || {}
    const currentCognitive = (identity.cognitive_style as CognitiveStyle | null) || {}

    const styleUpdates: Record<string, unknown> = {}
    const cognitiveUpdates: Record<string, unknown> = {}

    const styleFields = ['sentence_length', 'vocabulary_level', 'formality', 'punctuation_habits', 'formatting_prefs', 'signature_phrases', 'tone_markers']
    const cognitiveFields = ['decision_approach', 'uncertainty_response', 'explanation_preference', 'feedback_style', 'context_need']

    for (const [key, value] of Object.entries(data.field_updates)) {
      if (styleFields.includes(key)) {
        styleUpdates[key] = value
      } else if (cognitiveFields.includes(key)) {
        cognitiveUpdates[key] = value
      }
    }

    const updateData: Record<string, unknown> = {
      refinement_log: newLog,
      updated_at: new Date().toISOString(),
    }

    if (Object.keys(styleUpdates).length > 0) {
      updateData.style_profile = { ...currentStyle, ...styleUpdates }
    }
    if (Object.keys(cognitiveUpdates).length > 0) {
      updateData.cognitive_style = { ...currentCognitive, ...cognitiveUpdates }
    }

    const { error: updateError } = await supabase
      .from('identity_cores')
      .update(updateData)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Refinement update error:', updateError)
      return { success: false, error: 'Failed to save refinement' }
    }

    revalidatePath('/settings')
    revalidatePath('/roles')

    return { success: true }
  } catch (error) {
    console.error('Refinement error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
