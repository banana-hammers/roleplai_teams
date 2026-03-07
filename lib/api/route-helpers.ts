import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'

type AuthSuccess = { supabase: SupabaseClient; user: User }

/**
 * Authenticate the current user for API routes.
 * Returns { supabase, user } on success, or a NextResponse with 401 on failure.
 *
 * Usage:
 *   const auth = await requireAuthForRoute()
 *   if (auth instanceof NextResponse) return auth
 *   const { supabase, user } = auth
 */
export async function requireAuthForRoute(): Promise<AuthSuccess | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { supabase, user }
}
