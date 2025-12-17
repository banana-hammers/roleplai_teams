'use client'

import { useState, useEffect, useCallback } from 'react'
import type { RoleCreationLocalState, ExtractionResult, ExtractedRoleConfig } from '@/types/role-creation'

const STORAGE_KEY = 'role_creation_state'
const DEFAULT_STATE: RoleCreationLocalState = { currentStep: 1 }

/**
 * Hook for managing ephemeral role creation state in localStorage
 */
export function useRoleCreationState() {
  // Always start with default state to avoid hydration mismatch
  const [state, setState] = useState<RoleCreationLocalState>(DEFAULT_STATE)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after hydration (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setState(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load role creation state:', error)
    }
    setIsHydrated(true)
  }, [])

  // Auto-save to localStorage on changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.error('Failed to save role creation state:', error)
      }
    }
  }, [state, isHydrated])

  // Update state helper
  const updateState = useCallback((updates: Partial<RoleCreationLocalState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // Set interview messages
  const setInterviewMessages = useCallback((messages: Array<{ role: string; content: string }>) => {
    setState(prev => ({ ...prev, interviewMessages: messages }))
  }, [])

  // Set extracted config
  const setExtractedConfig = useCallback((config: ExtractionResult) => {
    // Initialize all skills as selected by default
    const selectedSkillIds = config.skills.map((_, index) => index.toString())
    setState(prev => ({
      ...prev,
      extractedConfig: config,
      selectedSkillIds,
    }))
  }, [])

  // Toggle skill selection
  const toggleSkill = useCallback((index: number) => {
    setState(prev => {
      const currentSelected = prev.selectedSkillIds || []
      const indexStr = index.toString()
      const isSelected = currentSelected.includes(indexStr)

      return {
        ...prev,
        selectedSkillIds: isSelected
          ? currentSelected.filter(id => id !== indexStr)
          : [...currentSelected, indexStr],
      }
    })
  }, [])

  // Update edited role
  const updateEditedRole = useCallback((updates: Partial<ExtractedRoleConfig>) => {
    setState(prev => ({
      ...prev,
      editedRole: { ...prev.editedRole, ...updates },
    }))
  }, [])

  // Get merged role config (original + edits)
  const getMergedRoleConfig = useCallback((): ExtractedRoleConfig | null => {
    if (!state.extractedConfig) return null
    return {
      ...state.extractedConfig.role,
      ...state.editedRole,
    }
  }, [state.extractedConfig, state.editedRole])

  // Get selected skills
  const getSelectedSkills = useCallback(() => {
    if (!state.extractedConfig || !state.selectedSkillIds) return []
    return state.selectedSkillIds
      .map(id => parseInt(id, 10))
      .filter(index => index >= 0 && index < state.extractedConfig!.skills.length)
      .map(index => state.extractedConfig!.skills[index])
  }, [state.extractedConfig, state.selectedSkillIds])

  // Go to step
  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  // Set created role ID
  const setCreatedRoleId = useCallback((roleId: string) => {
    setState(prev => ({ ...prev, createdRoleId: roleId }))
  }, [])

  // Clear localStorage on completion
  const clearState = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    setState(DEFAULT_STATE)
  }, [])

  // Reset to step 1 (for "Let Me Adjust" flow)
  const resetToInterview = useCallback(() => {
    setState(prev => ({
      currentStep: 1,
      interviewMessages: prev.interviewMessages, // Keep messages
    }))
  }, [])

  return {
    state,
    setState,
    updateState,
    isHydrated,
    // Interview
    setInterviewMessages,
    // Extraction
    setExtractedConfig,
    // Skills
    toggleSkill,
    getSelectedSkills,
    // Role editing
    updateEditedRole,
    getMergedRoleConfig,
    // Navigation
    goToStep,
    resetToInterview,
    // Completion
    setCreatedRoleId,
    clearState,
  }
}
