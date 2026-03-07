'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
}

interface SignupResult {
  success: boolean
  error?: string
  redirectTo?: string
}

interface LoginFormData {
  email: string
  password: string
}

interface LoginResult {
  success: boolean
  error?: string
  redirectTo?: string
}

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number'
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character'
  }
  return null
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

  // Profile trigger fallback: create profile if missing
  if (!profile) {
    await supabase.from('profiles').insert({
      id: authData.user.id,
      email: authData.user.email,
      onboarding_completed: false,
    })
    return { success: true, redirectTo: '/onboarding' }
  }

  if (profile.onboarding_completed === false) {
    return { success: true, redirectTo: '/onboarding' }
  } else {
    return { success: true, redirectTo: '/' }
  }
}

export async function signup(formData: SignupFormData): Promise<SignupResult> {
  // Validate passwords match
  if (formData.password !== formData.confirmPassword) {
    return { success: false, error: 'Passwords do not match' }
  }

  // Validate password strength
  const passwordError = validatePassword(formData.password)
  if (passwordError) {
    return { success: false, error: passwordError }
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
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback`,
    },
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
  return { success: true, redirectTo: `/verify-email?email=${encodeURIComponent(formData.email)}` }
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset({ email }: { email: string }): Promise<{ success: boolean; error?: string }> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email format' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback?next=/reset-password`,
  })

  if (error) {
    console.error('Password reset error:', error)
  }

  // Always return success for security (don't reveal if email exists)
  return { success: true }
}

export async function updatePassword({ password, confirmPassword }: { password: string; confirmPassword: string }): Promise<{ success: boolean; error?: string }> {
  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match' }
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    return { success: false, error: passwordError }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('Update password error:', error)
    return { success: false, error: 'Failed to update password. Please try again.' }
  }

  return { success: true }
}

export async function resendVerificationEmail({ email }: { email: string }): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback`,
    },
  })

  if (error) {
    console.error('Resend verification error:', error)
    return { success: false, error: 'Failed to resend verification email.' }
  }

  return { success: true }
}
