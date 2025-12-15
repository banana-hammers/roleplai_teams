'use client'

import { useState, useEffect } from 'react'

export interface OnboardingLocalState {
  currentStep: number // 1-5
  aliasName?: string
  interviewMessages?: Array<{ role: string; content: string }>
  extractedPersonality?: {
    voice: string
    priorities: string[]
    boundaries: string[]
  }
  testDriveMessages?: Array<{ role: string; content: string }>
}

const STORAGE_KEY = 'onboarding_state'
const DEFAULT_STATE: OnboardingLocalState = { currentStep: 1 }

/**
 * Hook for managing ephemeral onboarding state in localStorage
 */
export function useOnboardingState() {
  // Always start with default state to avoid hydration mismatch
  const [state, setState] = useState<OnboardingLocalState>(DEFAULT_STATE)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after hydration (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error)
    }
    setIsHydrated(true)
  }, [])

  // Auto-save to localStorage on changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.error('Failed to save onboarding state:', error)
      }
    }
  }, [state, isHydrated])

  // Clear localStorage on completion
  const completeOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return { state, setState, completeOnboarding, isHydrated }
}
