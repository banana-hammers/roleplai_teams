'use server'

import { requireAuth } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'

export interface UpdateIdentityCoreData {
  voice: string
  priorities: string[] // Ordered array of top 3 priorities
  boundaries: Record<string, boolean | string[]>
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
    const { error } = await supabase
      .from('identity_cores')
      .update({
        voice: data.voice,
        priorities: data.priorities,
        boundaries: data.boundaries,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('Identity core update error:', error)
      return { success: false, error: 'Failed to update identity core' }
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
    const { error } = await supabase.from('identity_cores').upsert(
      {
        user_id: user.id,
        voice: data.voice,
        priorities: data.priorities,
        boundaries: data.boundaries,
        updated_at: new Date().toISOString(),
      },
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
