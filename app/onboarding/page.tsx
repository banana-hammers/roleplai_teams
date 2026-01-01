'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressIndicator } from '@/components/ui/progress-indicator'
import { AliasName } from '@/components/onboarding/alias-name'
import { AIInterview } from '@/components/onboarding/ai-interview'
import { IdentitySummary } from '@/components/onboarding/identity-summary'
import { TestDrive } from '@/components/onboarding/test-drive'
import { Completion } from '@/components/onboarding/completion'
import { useOnboardingState } from '@/lib/hooks/use-onboarding-state'
import { generateIdentityCore, generateBehaviorExamples } from '@/lib/onboarding/generate-identity'

const TOTAL_STEPS = 5

export default function OnboardingPage() {
  const { state, setState, isHydrated } = useOnboardingState()

  // Generate identity and examples when personality is extracted
  const { identity, examples } = useMemo(() => {
    if (!state.extractedPersonality) {
      return { identity: null, examples: [] }
    }

    const identity = generateIdentityCore(state.extractedPersonality)
    const examples = generateBehaviorExamples(state.extractedPersonality)

    return { identity, examples }
  }, [state.extractedPersonality])

  const handleAliasNext = (alias: string) => {
    setState({
      ...state,
      aliasName: alias,
      currentStep: 2,
    })
  }

  const handleInterviewComplete = async (messages: Array<{ role: string; content: string }>) => {
    // Save interview messages to state
    setState({
      ...state,
      interviewMessages: messages,
      currentStep: 3,
    })

    // Extract personality in the background
    try {
      const response = await fetch('/api/onboarding/extract-personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })

      if (response.ok) {
        const personality = await response.json()
        setState(prev => ({
          ...prev,
          extractedPersonality: personality,
        }))
      }
    } catch (error) {
      console.error('Failed to extract personality:', error)
    }
  }

  const handleInterviewBack = () => {
    setState({
      ...state,
      currentStep: 1,
    })
  }

  const handleIdentityNext = () => {
    setState({
      ...state,
      currentStep: 4,
    })
  }

  const handleIdentityEdit = () => {
    setState({
      ...state,
      currentStep: 2,
    })
  }

  const handleTestDriveConfirm = () => {
    setState({
      ...state,
      currentStep: 5,
    })
  }

  const handleTestDriveAdjust = () => {
    setState({
      ...state,
      currentStep: 3,
    })
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
          <ProgressIndicator
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            className="mb-8"
          />

          {state.currentStep === 1 && (
            <AliasName
              initialValue={state.aliasName}
              onNext={handleAliasNext}
            />
          )}

          {state.currentStep === 2 && (
            <AIInterview
              onComplete={handleInterviewComplete}
              onBack={handleInterviewBack}
            />
          )}

          {state.currentStep === 3 && identity && (
            <IdentitySummary
              aliasName={state.aliasName || ''}
              identity={identity}
              examples={examples}
              onNext={handleIdentityNext}
              onEdit={handleIdentityEdit}
            />
          )}

          {state.currentStep === 4 && identity && (
            <TestDrive
              identity={identity}
              onConfirm={handleTestDriveConfirm}
              onAdjust={handleTestDriveAdjust}
            />
          )}

          {state.currentStep === 5 && identity && (
            <Completion
              aliasName={state.aliasName || ''}
              identity={identity}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
