'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { IdentityCore } from '@/lib/onboarding/generate-identity'

export interface CompleteOnboardingData {
  alias: string
  identity: IdentityCore
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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

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

    // Create identity core
    const { error: identityError } = await supabase
      .from('identity_cores')
      .insert({
        user_id: user.id,
        voice: data.identity.voice,
        priorities: data.identity.priorities,
        boundaries: data.identity.boundaries,
        decision_rules: data.identity.decision_rules,
      })

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
