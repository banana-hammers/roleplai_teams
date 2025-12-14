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

/**
 * Hook for managing ephemeral onboarding state in localStorage
 */
export function useOnboardingState() {
  const [state, setState] = useState<OnboardingLocalState>(() => {
    // Load from localStorage on mount (client-side only)
    if (typeof window === 'undefined') {
      return { currentStep: 1 }
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : { currentStep: 1 }
    } catch (error) {
      console.error('Failed to load onboarding state:', error)
      return { currentStep: 1 }
    }
  })

  // Auto-save to localStorage on changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.error('Failed to save onboarding state:', error)
      }
    }
  }, [state])

  // Clear localStorage on completion
  const completeOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return { state, setState, completeOnboarding }
}
