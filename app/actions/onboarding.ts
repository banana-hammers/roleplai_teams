'use server'

import { requireAuth } from '@/lib/supabase/auth-helpers'
import type { IdentityCore } from '@/lib/onboarding/generate-identity'

export interface CompleteOnboardingData {
  alias: string
  identity: IdentityCore
  writingSamples?: string[]
}

export interface CompleteOnboardingResult {
  success: boolean
  error?: string
}

/**
 * Complete onboarding by saving identity core and updating profile
 */
export async function completeOnboarding(
  data: CompleteOnboardingData
): Promise<CompleteOnboardingResult> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  try {
    // Upsert profile with alias and completion flag (creates if missing)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        alias: data.alias,
        onboarding_completed: true,
      })

    if (profileError) {
      console.error('Profile update error:', profileError)
      return { success: false, error: 'Failed to update profile' }
    }

    // Create or update identity core (upsert for idempotency on double-click/retry)
    const identityData: Record<string, unknown> = {
      user_id: user.id,
      voice: data.identity.voice,
      priorities: data.identity.priorities,
      boundaries: data.identity.boundaries,
    }
    if (data.identity.style_profile) identityData.style_profile = data.identity.style_profile
    if (data.identity.cognitive_style) identityData.cognitive_style = data.identity.cognitive_style
    if (data.writingSamples && data.writingSamples.length > 0) identityData.writing_samples = data.writingSamples

    const { error: identityError } = await supabase
      .from('identity_cores')
      .upsert(identityData, { onConflict: 'user_id' })

    if (identityError) {
      console.error('Identity core creation error:', identityError)
      return { success: false, error: 'Failed to create identity core' }
    }

    return { success: true }
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
