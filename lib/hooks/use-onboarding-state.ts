'use client'

import type { ExtractedPersonality } from '@/lib/onboarding/generate-identity'
import type { LoreType } from '@/types/identity'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'

export interface ExtractedLoreEntry {
  name: string
  content: string
  type: LoreType
}

export interface OnboardingLocalState {
  currentStep: number // 1-7
  aliasName?: string
  loremasterMessages?: Array<{ role: string; content: string }>
  extractedLore?: ExtractedLoreEntry[]
  companyName?: string
  loreSaved?: boolean
  loremasterSkipped?: boolean
  interviewMessages?: Array<{ role: string; content: string }>
  extractedPersonality?: ExtractedPersonality
  testDriveMessages?: Array<{ role: string; content: string }>
  writingSamples?: string[]
  writingSamplesProcessed?: boolean
}

const STORAGE_KEY = 'onboarding_state'
const DEFAULT_STATE: OnboardingLocalState = { currentStep: 1 }

/**
 * Hook for managing ephemeral onboarding state in localStorage
 */
export function useOnboardingState() {
  const { value: state, setValue: setState, isHydrated, removeValue } = useLocalStorage<OnboardingLocalState>(STORAGE_KEY, DEFAULT_STATE)

  // Clear localStorage on completion
  const completeOnboarding = () => {
    removeValue()
  }

  return { state, setState, completeOnboarding, isHydrated }
}
