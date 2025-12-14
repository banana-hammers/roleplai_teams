'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
}

export interface SignupResult {
  success: boolean
  error?: string
}

export async function signup(formData: SignupFormData): Promise<SignupResult> {
  // Validate passwords match
  if (formData.password !== formData.confirmPassword) {
    return { success: false, error: 'Passwords do not match' }
  }

  // Validate password strength
  if (formData.password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }

  if (!/\d/.test(formData.password)) {
    return { success: false, error: 'Password must contain at least one number' }
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
    return { success: false, error: 'Password must contain at least one special character' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    return { success: false, error: 'Invalid email format' }
  }

  const supabase = await createClient()

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  })

  if (authError) {
    console.error('Signup error:', authError)
    return {
      success: false,
      error: authError.message || 'Failed to create account. Please try again.'
    }
  }

  if (!authData.user) {
    return {
      success: false,
      error: 'Failed to create account. Please try again.'
    }
  }

  // Create profile record
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: formData.email,
      onboarding_completed: false,
    })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    // User is created but profile failed - this is a critical error
    return {
      success: false,
      error: 'Account created but profile setup failed. Please contact support.'
    }
  }

  // Redirect to onboarding
  redirect('/onboarding')
}
