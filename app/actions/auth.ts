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

export interface LoginFormData {
  email: string
  password: string
}

export interface LoginResult {
  success: boolean
  error?: string
}

export async function login(formData: LoginFormData): Promise<LoginResult> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    return { success: false, error: 'Invalid email format' }
  }

  const supabase = await createClient()

  // Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (authError) {
    console.error('Login error:', authError)
    // User-friendly error messages
    if (authError.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Invalid email or password' }
    }
    if (authError.message.includes('Email not confirmed')) {
      return { success: false, error: 'Please verify your email address' }
    }
    return { success: false, error: 'Sign in failed. Please try again.' }
  }

  if (!authData.user) {
    return { success: false, error: 'Sign in failed. Please try again.' }
  }

  // Check if user completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', authData.user.id)
    .single()

  // Redirect to onboarding if no profile exists or onboarding not completed
  if (!profile || profile.onboarding_completed === false) {
    redirect('/onboarding')
  } else {
    redirect('/')
  }
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

  // Profile is created automatically via database trigger (handle_new_user)
  // Redirect to onboarding
  redirect('/onboarding')
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
