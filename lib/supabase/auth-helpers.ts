import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type AuthSuccess = { supabase: SupabaseClient; user: User }
type AuthError = { error: string }

/**
 * Authenticate the current user and return the Supabase client + user.
 * Use with: `const auth = await requireAuth(); if ('error' in auth) return ...`
 */
export async function requireAuth(): Promise<AuthSuccess | AuthError> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  return { supabase, user }
}

/**
 * Verify that a role belongs to the given user.
 * Returns true if ownership is confirmed, false otherwise.
 */
export async function verifyRoleOwnership(
  supabase: SupabaseClient,
  roleId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .eq('id', roleId)
    .eq('user_id', userId)
    .single()

  return !error && !!data
}
