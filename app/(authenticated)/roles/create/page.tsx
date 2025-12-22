'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressIndicator } from '@/components/ui/progress-indicator'
import { RoleInterview } from '@/components/roles/role-interview'
import { RolePreview } from '@/components/roles/role-preview'
import { RoleSkillsPreview } from '@/components/roles/role-skills-preview'
import { RoleCreationComplete } from '@/components/roles/role-creation-complete'
import { useRoleCreationState } from '@/lib/hooks/use-role-creation-state'
import { createRoleWithSkills } from '@/app/actions/roles'
import { Loader2 } from 'lucide-react'
import type { ExtractionResult } from '@/types/role-creation'

const TOTAL_STEPS = 3

export default function RoleCreationPage() {
  const {
    state,
    isHydrated,
    setInterviewMessages,
    setExtractedConfig,
    toggleSkill,
    getSelectedSkills,
    updateEditedRole,
    getMergedRoleConfig,
    goToStep,
    resetToInterview,
    setCreatedRoleId,
    clearState,
  } = useRoleCreationState()

  const [isExtracting, setIsExtracting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle interview completion
  const handleInterviewComplete = async (messages: Array<{ role: string; content: string }>) => {
    setInterviewMessages(messages)
    setIsExtracting(true)
    setError(null)

    try {
      // Call extraction API
      const response = await fetch('/api/roles/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to extract role configuration')
      }

      const extracted: ExtractionResult = await response.json()
      setExtractedConfig(extracted)
      goToStep(2)
    } catch (err) {
      console.error('Extraction error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate role. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  // Handle role creation
  const handleCreateRole = async () => {
    const roleConfig = getMergedRoleConfig()
    const selectedSkills = getSelectedSkills()

    if (!roleConfig || !state.extractedConfig) {
      setError('Missing role configuration')
      return
    }

    if (state.selectedSkillIds?.length === 0) {
      setError('Please select at least one skill')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const result = await createRoleWithSkills({
        role: roleConfig,
        skills: state.extractedConfig.skills,
        selectedSkillIndices: (state.selectedSkillIds || []).map(id => parseInt(id, 10)),
      })

      if (!result.success || !result.roleId) {
        throw new Error(result.error || 'Failed to create role')
      }

      setCreatedRoleId(result.roleId)
      goToStep(3)
    } catch (err) {
      console.error('Creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create role. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle creating another role
  const handleCreateAnother = () => {
    clearState()
  }

  // Show loading state until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          {state.currentStep < 3 && (
            <ProgressIndicator
              currentStep={state.currentStep}
              totalSteps={TOTAL_STEPS}
              className="mb-8"
            />
          )}

          {/* Step 1: AI Interview */}
          {state.currentStep === 1 && !isExtracting && (
            <RoleInterview
              onComplete={handleInterviewComplete}
            />
          )}

          {/* Extracting state */}
          {isExtracting && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Generating Your Role
                </h2>
                <p className="text-muted-foreground">
                  Creating role configuration and starter skills...
                </p>
              </div>
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          )}

          {/* Step 2: Preview and Edit */}
          {state.currentStep === 2 && state.extractedConfig && (
            <div className="space-y-6">
              <RolePreview
                role={getMergedRoleConfig()!}
                onEdit={updateEditedRole}
              />

              <div className="border-t pt-6">
                <RoleSkillsPreview
                  skills={state.extractedConfig.skills}
                  selectedIndices={(state.selectedSkillIds || []).map(id => parseInt(id, 10))}
                  onToggle={toggleSkill}
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
                  {error}
                </div>
              )}

              <div className="flex justify-between gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={resetToInterview}
                  disabled={isCreating}
                >
                  Let Me Adjust
                </Button>
                <Button
                  onClick={handleCreateRole}
                  disabled={isCreating || (state.selectedSkillIds?.length || 0) === 0}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Looks Good'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {state.currentStep === 3 && state.extractedConfig && state.createdRoleId && (
            <RoleCreationComplete
              role={getMergedRoleConfig()!}
              skills={getSelectedSkills()}
              roleId={state.createdRoleId}
              onCreateAnother={handleCreateAnother}
            />
          )}

          {/* Error state (not extracting) */}
          {error && !isExtracting && state.currentStep === 1 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
              {error}
              <Button
                variant="link"
                className="ml-2 p-0 h-auto text-red-900 dark:text-red-100 underline"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
