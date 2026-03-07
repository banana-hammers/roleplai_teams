import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // Profile trigger fallback: ensure profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Profile trigger failed — create profile manually
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      onboarding_completed: false,
    })
  }

  // Password reset flow: redirect to reset page
  if (next === '/reset-password') {
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  // Check onboarding status
  const onboardingCompleted = profile?.onboarding_completed ?? false

  if (!onboardingCompleted) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
