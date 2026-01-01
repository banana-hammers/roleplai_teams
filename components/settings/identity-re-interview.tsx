'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AIInterview } from '@/components/onboarding/ai-interview'
import {
  generateIdentityCore,
  generateBehaviorExamples,
  type ExtractedPersonality,
  type IdentityCore,
  type BehaviorExample,
} from '@/lib/onboarding/generate-identity'
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import type { UpdateIdentityCoreData } from '@/app/actions/identity'

type ReInterviewStep = 'confirm' | 'interview' | 'preview' | 'saving'

interface IdentityReInterviewProps {
  onComplete: (data: UpdateIdentityCoreData) => Promise<void>
  onCancel: () => void
}

export function IdentityReInterview({
  onComplete,
  onCancel,
}: IdentityReInterviewProps) {
  const [step, setStep] = useState<ReInterviewStep>('confirm')
  const [newIdentity, setNewIdentity] = useState<IdentityCore | null>(null)
  const [examples, setExamples] = useState<BehaviorExample[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirmStart = () => {
    setStep('interview')
  }

  const handleInterviewComplete = async (
    messages: Array<{ role: string; content: string }>
  ) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Call the extract-personality API
      const response = await fetch('/api/onboarding/extract-personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        throw new Error('Failed to extract personality')
      }

      const personality: ExtractedPersonality = await response.json()

      // Generate identity core and examples
      const identity = generateIdentityCore(personality)
      const behaviorExamples = generateBehaviorExamples(personality)

      setNewIdentity(identity)
      setExamples(behaviorExamples)
      setStep('preview')
    } catch (err) {
      console.error('Error processing interview:', err)
      setError('Failed to process interview. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveNewIdentity = async () => {
    if (!newIdentity) return

    setStep('saving')
    setError(null)

    try {
      await onComplete({
        voice: newIdentity.voice,
        priorities: newIdentity.priorities,
        boundaries: newIdentity.boundaries,
      })
    } catch (err) {
      console.error('Error saving identity:', err)
      setError('Failed to save new identity. Please try again.')
      setStep('preview')
    }
  }

  const handleTryAgain = () => {
    setNewIdentity(null)
    setExamples([])
    setError(null)
    setStep('interview')
  }

  // Confirmation Dialog
  if (step === 'confirm') {
    return (
      <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Start New Interview?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will start a fresh interview with Nova to rebuild your
                identity core from scratch.
              </p>
              <p className="font-medium text-foreground">
                Your current identity will be replaced after you confirm the new
                one.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStart}>
              Start Interview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Interview Step
  if (step === 'interview') {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
            {error}
          </div>
        )}

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Analyzing your responses...
            </p>
          </div>
        ) : (
          <AIInterview
            onComplete={handleInterviewComplete}
            onBack={onCancel}
          />
        )}
      </div>
    )
  }

  // Preview Step
  if (step === 'preview' && newIdentity) {
    // Priorities are now an ordered array
    const rankedPriorities = newIdentity.priorities || []

    const activeBoundaries = Object.entries(newIdentity.boundaries)
      .filter(([key, value]) => key !== 'custom' && value === true)
      .map(([name]) => name.replace(/_/g, ' '))

    const customBoundaries = newIdentity.boundaries.custom as string[] | undefined

    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-semibold">Your New Identity</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Review your new identity before saving.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
            {error}
          </div>
        )}

        {/* Identity Summary Card */}
        <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              VOICE
            </h4>
            <p className="text-sm">{newIdentity.voice}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              VALUES (Ranked)
            </h4>
            <div className="flex flex-wrap gap-2">
              {rankedPriorities.map((priority, index) => (
                <Badge
                  key={priority}
                  variant={index === 0 ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {index + 1}. {priority}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              BOUNDARIES
            </h4>
            <ul className="space-y-1 text-sm">
              {activeBoundaries.map((boundary) => (
                <li key={boundary} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="capitalize">{boundary}</span>
                </li>
              ))}
              {customBoundaries?.map((boundary, idx) => (
                <li key={`custom-${idx}`} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{boundary}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Behavior Examples */}
        {examples.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">How This Affects Behavior</h4>
            {examples.slice(0, 3).map((example, idx) => (
              <div
                key={idx}
                className="rounded-lg border bg-muted/50 p-3 space-y-2"
              >
                <p className="text-xs font-medium">
                  <span className="text-muted-foreground">Scenario:</span>{' '}
                  {example.scenario}
                </p>
                <div className="rounded bg-background p-2 text-xs">
                  <span className="font-medium">AI:</span>{' '}
                  <span className="text-muted-foreground">
                    "{example.response}"
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between pt-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="ghost" onClick={handleTryAgain}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
          <Button onClick={handleSaveNewIdentity}>
            Save New Identity
          </Button>
        </div>
      </div>
    )
  }

  // Saving Step
  if (step === 'saving') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Saving your new identity...</p>
      </div>
    )
  }

  return null
}
