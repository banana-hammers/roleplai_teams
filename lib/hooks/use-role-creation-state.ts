'use client'

import { useCallback } from 'react'
import type { RoleCreationLocalState, ExtractionResult, ExtractedRoleConfig } from '@/types/role-creation'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'

const STORAGE_KEY = 'role_creation_state'
const DEFAULT_STATE: RoleCreationLocalState = { currentStep: 1 }

/**
 * Hook for managing ephemeral role creation state in localStorage
 */
export function useRoleCreationState() {
  const { value: state, setValue: setState, isHydrated, removeValue } = useLocalStorage<RoleCreationLocalState>(STORAGE_KEY, DEFAULT_STATE)

  // Update state helper
  const updateState = useCallback((updates: Partial<RoleCreationLocalState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [setState])

  // Set interview messages
  const setInterviewMessages = useCallback((messages: Array<{ role: string; content: string }>) => {
    setState(prev => ({ ...prev, interviewMessages: messages }))
  }, [setState])

  // Set extracted config
  const setExtractedConfig = useCallback((config: ExtractionResult) => {
    // Initialize all skills as selected by default
    const selectedSkillIds = config.skills.map((_, index) => index.toString())
    setState(prev => ({
      ...prev,
      extractedConfig: config,
      selectedSkillIds,
    }))
  }, [setState])

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
  }, [setState])

  // Update edited role
  const updateEditedRole = useCallback((updates: Partial<ExtractedRoleConfig>) => {
    setState(prev => ({
      ...prev,
      editedRole: { ...prev.editedRole, ...updates },
    }))
  }, [setState])

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
  }, [setState])

  // Set created role ID
  const setCreatedRoleId = useCallback((roleId: string) => {
    setState(prev => ({ ...prev, createdRoleId: roleId }))
  }, [setState])

  // Clear localStorage on completion
  const clearState = useCallback(() => {
    removeValue()
  }, [removeValue])

  // Reset to step 1 (for "Let Me Adjust" flow)
  const resetToInterview = useCallback(() => {
    setState(prev => ({
      currentStep: 1,
      interviewMessages: prev.interviewMessages, // Keep messages
    }))
  }, [setState])

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
