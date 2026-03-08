'use server'

import { requireAuth } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import type { StyleProfile, CognitiveStyle } from '@/types/identity'

export interface UpdateIdentityCoreData {
  voice?: string
  priorities?: string[] // Ordered array of top 3 priorities
  boundaries?: Record<string, boolean | string[]>
  style_profile?: StyleProfile
  cognitive_style?: CognitiveStyle
}

export interface UpdateIdentityCoreResult {
  success: boolean
  error?: string
}

/**
 * Update the user's identity core
 */
export async function updateIdentityCore(
  data: UpdateIdentityCoreData
): Promise<UpdateIdentityCoreResult> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (data.voice !== undefined) updateData.voice = data.voice
    if (data.priorities !== undefined) updateData.priorities = data.priorities
    if (data.boundaries !== undefined) updateData.boundaries = data.boundaries
    if (data.style_profile !== undefined) updateData.style_profile = data.style_profile
    if (data.cognitive_style !== undefined) updateData.cognitive_style = data.cognitive_style

    const { data: rows, error } = await supabase
      .from('identity_cores')
      .update(updateData)
      .eq('user_id', user.id)
      .select('user_id')

    if (error) {
      console.error('Identity core update error:', error)
      return { success: false, error: 'Failed to update identity core' }
    }

    if (!rows || rows.length === 0) {
      return { success: false, error: 'No identity core found. Complete onboarding first.' }
    }

    revalidatePath('/settings')
    revalidatePath('/roles')

    return { success: true }
  } catch (error) {
    console.error('Identity core update error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Replace the user's identity core (used after re-interview)
 */
export async function replaceIdentityCore(
  data: UpdateIdentityCoreData
): Promise<UpdateIdentityCoreResult> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  try {
    // Upsert - update if exists, insert if not
    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      voice: data.voice,
      priorities: data.priorities,
      boundaries: data.boundaries,
      updated_at: new Date().toISOString(),
    }
    if (data.style_profile !== undefined) upsertData.style_profile = data.style_profile
    if (data.cognitive_style !== undefined) upsertData.cognitive_style = data.cognitive_style

    const { error } = await supabase.from('identity_cores').upsert(
      upsertData,
      {
        onConflict: 'user_id',
      }
    )

    if (error) {
      console.error('Identity core replace error:', error)
      return { success: false, error: 'Failed to replace identity core' }
    }

    revalidatePath('/settings')
    revalidatePath('/roles')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Identity core replace error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
