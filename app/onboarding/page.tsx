'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressIndicator } from '@/components/ui/progress-indicator'
import { AliasName } from '@/components/onboarding/alias-name'
import { LoremasterInterview } from '@/components/onboarding/loremaster-interview'
import { LoreSummary } from '@/components/onboarding/lore-summary'
import { AIInterview } from '@/components/onboarding/ai-interview'
import { WritingSamples } from '@/components/onboarding/writing-samples'
import { IdentitySummary } from '@/components/onboarding/identity-summary'
import { TestDrive } from '@/components/onboarding/test-drive'
import { Completion } from '@/components/onboarding/completion'
import { useOnboardingState } from '@/lib/hooks/use-onboarding-state'
import { generateIdentityCore, generateBehaviorExamples } from '@/lib/onboarding/generate-identity'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StyleProfile } from '@/types/identity'

const TOTAL_STEPS = 7

export default function OnboardingPage() {
  const { state, setState, isHydrated } = useOnboardingState()
  const [extracting, setExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [analyzingWriting, setAnalyzingWriting] = useState(false)
  const [extractingLore, setExtractingLore] = useState(false)
  const [loreExtractionError, setLoreExtractionError] = useState<string | null>(null)

  // Generate identity and examples when personality is extracted
  const { identity, examples } = useMemo(() => {
    if (!state.extractedPersonality) {
      return { identity: null, examples: [] }
    }

    const identity = generateIdentityCore(state.extractedPersonality)
    const examples = generateBehaviorExamples(state.extractedPersonality)

    return { identity, examples }
  }, [state.extractedPersonality])

  // Step 1: Alias
  const handleAliasNext = (alias: string) => {
    setState({
      ...state,
      aliasName: alias,
      currentStep: 2,
    })
  }

  // Step 2: Loremaster Interview
  const extractLore = async (messages: Array<{ role: string; content: string }>) => {
    setExtractingLore(true)
    setLoreExtractionError(null)

    try {
      const response = await fetch('/api/onboarding/extract-lore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })

      if (response.ok) {
        const data = await response.json()
        setState(prev => ({
          ...prev,
          extractedLore: data.entries,
          companyName: data.companyName,
          currentStep: 3,
        }))
      } else {
        setLoreExtractionError('Failed to extract company lore. Please try again.')
      }
    } catch (error) {
      console.error('Failed to extract lore:', error)
      setLoreExtractionError('Something went wrong. Please try again.')
    } finally {
      setExtractingLore(false)
    }
  }

  const handleLoremasterComplete = async (messages: Array<{ role: string; content: string }>) => {
    setState({
      ...state,
      loremasterMessages: messages,
    })

    await extractLore(messages)
  }

  const handleLoremasterSkip = () => {
    setState({
      ...state,
      loremasterSkipped: true,
      currentStep: 4,
    })
  }

  const handleLoremasterBack = () => {
    setState({
      ...state,
      currentStep: 1,
    })
  }

  // Step 3: Lore Summary
  const handleLoreSummaryNext = () => {
    setState(prev => ({
      ...prev,
      loreSaved: true,
      currentStep: 4,
    }))
  }

  const handleLoreSummaryBack = () => {
    setState({
      ...state,
      currentStep: 2,
    })
  }

  // Step 4: Nova Interview
  const extractPersonality = async (messages: Array<{ role: string; content: string }>) => {
    setExtracting(true)
    setExtractionError(null)

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
      } else {
        setExtractionError('Failed to analyze your personality. Please try again.')
      }
    } catch (error) {
      console.error('Failed to extract personality:', error)
      setExtractionError('Something went wrong. Please try again.')
    } finally {
      setExtracting(false)
    }
  }

  const handleInterviewComplete = async (messages: Array<{ role: string; content: string }>) => {
    setState({
      ...state,
      interviewMessages: messages,
      currentStep: 5,
    })

    await extractPersonality(messages)
  }

  const handleInterviewBack = () => {
    // Go back to loremaster or alias depending on skip state
    setState({
      ...state,
      currentStep: state.loremasterSkipped ? 2 : 3,
    })
  }

  // Step 5: Writing Samples + Identity Summary
  const handleIdentityNext = () => {
    setState({
      ...state,
      currentStep: 6,
    })
  }

  const handleIdentityEdit = () => {
    setState({
      ...state,
      currentStep: 4,
    })
  }

  // Step 6: Test Drive
  const handleTestDriveConfirm = () => {
    setState({
      ...state,
      currentStep: 7,
    })
  }

  const handleTestDriveAdjust = () => {
    setState({
      ...state,
      currentStep: 5,
    })
  }

  // Writing Samples
  const handleWritingSamplesSkip = () => {
    setState(prev => ({
      ...prev,
      writingSamplesProcessed: true,
    }))
  }

  const handleWritingSamplesAnalyze = async (samples: string[]) => {
    setAnalyzingWriting(true)
    try {
      const response = await fetch('/api/onboarding/analyze-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples }),
      })

      if (response.ok) {
        const styleProfile: StyleProfile = await response.json()
        setState(prev => ({
          ...prev,
          writingSamples: samples,
          writingSamplesProcessed: true,
          extractedPersonality: prev.extractedPersonality
            ? { ...prev.extractedPersonality, style_profile: { ...prev.extractedPersonality.style_profile, ...styleProfile } }
            : prev.extractedPersonality,
        }))
      } else {
        setState(prev => ({
          ...prev,
          writingSamples: samples,
          writingSamplesProcessed: true,
        }))
      }
    } catch {
      setState(prev => ({
        ...prev,
        writingSamples: samples,
        writingSamplesProcessed: true,
      }))
    } finally {
      setAnalyzingWriting(false)
    }
  }

  // Show loading state until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-8 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <Card className="relative w-full max-w-2xl bg-card/70 backdrop-blur-xl shadow-2xl">
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
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-8 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <Card className="relative w-full max-w-2xl bg-card/70 backdrop-blur-xl shadow-2xl">
        <CardContent className="pt-6">
          <ProgressIndicator
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
            className="mb-8"
          />

          {/* Step 1: Alias Name */}
          {state.currentStep === 1 && (
            <AliasName
              initialValue={state.aliasName}
              onNext={handleAliasNext}
            />
          )}

          {/* Step 2: Loremaster Interview */}
          {state.currentStep === 2 && (
            <LoremasterInterview
              onComplete={handleLoremasterComplete}
              onBack={handleLoremasterBack}
              onSkip={handleLoremasterSkip}
            />
          )}

          {/* Step 3: Lore Summary (or extraction in progress) */}
          {state.currentStep === 3 && (extractingLore || loreExtractionError) && !state.extractedLore && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {extractingLore && (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Extracting company lore...</p>
                </>
              )}
              {loreExtractionError && !extractingLore && (
                <>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive text-center">
                    {loreExtractionError}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleLoreSummaryBack}>
                      Back to Interview
                    </Button>
                    <Button onClick={() => extractLore(state.loremasterMessages || [])}>
                      Retry
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {state.currentStep === 3 && state.extractedLore && (
            <LoreSummary
              companyName={state.companyName || 'Your Company'}
              entries={state.extractedLore}
              onNext={handleLoreSummaryNext}
              onBack={handleLoreSummaryBack}
            />
          )}

          {/* Step 4: Nova AI Interview */}
          {state.currentStep === 4 && (
            <AIInterview
              onComplete={handleInterviewComplete}
              onBack={handleInterviewBack}
            />
          )}

          {/* Step 5: Personality extraction → Writing Samples → Identity Summary */}
          {state.currentStep === 5 && !identity && (extracting || extractionError) && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {extracting && (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analyzing your personality...</p>
                </>
              )}
              {extractionError && !extracting && (
                <>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive text-center">
                    {extractionError}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleInterviewBack}>
                      Back to Interview
                    </Button>
                    <Button onClick={() => extractPersonality(state.interviewMessages || [])}>
                      Retry
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {state.currentStep === 5 && identity && !state.writingSamplesProcessed && (
            <WritingSamples
              onSkip={handleWritingSamplesSkip}
              onAnalyze={handleWritingSamplesAnalyze}
              loading={analyzingWriting}
            />
          )}

          {state.currentStep === 5 && identity && state.writingSamplesProcessed && (
            <IdentitySummary
              aliasName={state.aliasName || ''}
              identity={identity}
              examples={examples}
              onNext={handleIdentityNext}
              onEdit={handleIdentityEdit}
            />
          )}

          {/* Step 6: Test Drive */}
          {state.currentStep === 6 && identity && (
            <TestDrive
              identity={identity}
              onConfirm={handleTestDriveConfirm}
              onAdjust={handleTestDriveAdjust}
            />
          )}

          {/* Step 7: Completion */}
          {state.currentStep === 7 && identity && (
            <Completion
              aliasName={state.aliasName || ''}
              identity={identity}
              writingSamples={state.writingSamples}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
