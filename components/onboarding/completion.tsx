'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import type { IdentityCore } from '@/lib/onboarding/generate-identity'
import { completeOnboarding } from '@/app/actions/onboarding'
import { useRouter } from 'next/navigation'

interface CompletionProps {
  aliasName: string
  identity: IdentityCore
  writingSamples?: string[]
}

export function Completion({ aliasName, identity, writingSamples }: CompletionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const highPriorities = identity.priorities || []

  const activeBoundaries = Object.entries(identity.boundaries)
    .filter(([key, value]) => key !== 'custom' && value === true)
    .map(([name]) => name.replace(/_/g, ' '))

  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await completeOnboarding({
        alias: aliasName,
        identity,
        writingSamples,
      })

      if (!result.success) {
        setError(result.error || 'Failed to complete onboarding')
        setLoading(false)
        return
      }

      // Clear localStorage and redirect to dashboard/role creation
      if (typeof window !== 'undefined') {
        localStorage.removeItem('onboarding_state')
      }

      // Redirect to role creation
      router.push('/roles/create')
    } catch (err) {
      console.error('Completion error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome, @{aliasName}!
          </h2>
        </div>
        <p className="text-lg text-muted-foreground">
          🎉 Your identity is ready.
        </p>
      </div>

      {/* Identity Summary Card */}
      <div className="rounded-lg border-2 border-primary/20 bg-linear-to-br from-primary/10 to-primary/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <h3 className="text-lg font-semibold">YOUR IDENTITY</h3>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Voice</h4>
            <p className="text-sm">{identity.voice}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Values</h4>
            <div className="flex flex-wrap gap-2">
              {highPriorities.map((priority) => (
                <Badge key={priority} variant="secondary" className="capitalize">
                  {priority}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Boundaries</h4>
            <div className="flex flex-wrap gap-1">
              {activeBoundaries.map((boundary) => (
                <Badge key={boundary} variant="outline" className="text-xs capitalize">
                  {boundary}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* What's Next Section */}
      <div className="rounded-lg border bg-muted/50 p-6 space-y-4">
        <h3 className="text-lg font-semibold">What&apos;s next?</h3>

        <div className="space-y-3 text-sm">
          <p>
            Your <strong>IDENTITY</strong> is your core personality across all AI interactions.
          </p>

          <p>
            Now create your first <strong>ROLE</strong> - a specific AI agent for a specific task:
          </p>

          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span><strong>Email Assistant</strong> (drafts emails in your voice)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span><strong>Research Buddy</strong> (gathers info with your priorities)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span><strong>Code Reviewer</strong> (reviews PRs respecting your boundaries)</span>
            </li>
          </ul>

          <p className="text-muted-foreground italic">
            Each role uses your identity but adds task-specific skills and context.
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Complete Button */}
      <Button
        onClick={handleComplete}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          'Creating your identity...'
        ) : (
          <>
            Create Your First Role
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        You can always edit your identity later in settings
      </p>
    </div>
  )
}
