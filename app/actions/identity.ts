'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { IdentityCore } from '@/types/identity'

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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

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
 * Get the user's identity core
 */
export async function getIdentityCore(): Promise<{
  success: boolean
  identityCore?: IdentityCore
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const { data: identityCore, error } = await supabase
      .from('identity_cores')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Identity core fetch error:', error)
      return { success: false, error: 'Failed to fetch identity core' }
    }

    return { success: true, identityCore: identityCore ?? undefined }
  } catch (error) {
    console.error('Identity core fetch error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Replace the user's identity core (used after re-interview)
 */
export async function replaceIdentityCore(
  data: UpdateIdentityCoreData
): Promise<UpdateIdentityCoreResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

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
