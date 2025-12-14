'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { IdentityCore, BehaviorExample } from '@/lib/onboarding/generate-identity'
import { Sparkles, CheckCircle2 } from 'lucide-react'

interface IdentitySummaryProps {
  aliasName: string
  identity: IdentityCore
  examples: BehaviorExample[]
  onNext: () => void
  onEdit: () => void
}

export function IdentitySummary({
  aliasName,
  identity,
  examples,
  onNext,
  onEdit,
}: IdentitySummaryProps) {
  const highPriorities = Object.entries(identity.priorities)
    .filter(([, level]) => level === 'high')
    .map(([name]) => name)

  const activeBoundaries = Object.entries(identity.boundaries)
    .filter(([key, value]) => key !== 'custom' && value === true)
    .map(([name]) => name.replace(/_/g, ' '))

  const customBoundaries = identity.boundaries.custom as string[] | undefined

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Your Identity Profile
          </h2>
        </div>
        <p className="text-muted-foreground">
          Here's your identity! Let me show you how this translates to real conversations...
        </p>
      </div>

      {/* Identity Summary Card */}
      <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">ALIAS</h3>
          <p className="text-2xl font-bold">@{aliasName}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">VOICE</h3>
          <p className="text-sm">{identity.voice}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">VALUES</h3>
          <div className="flex flex-wrap gap-2">
            {highPriorities.map((priority) => (
              <Badge key={priority} variant="secondary" className="capitalize">
                {priority}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">BOUNDARIES</h3>
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
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">How This Affects Behavior</h3>
        <p className="text-sm text-muted-foreground">
          Here are concrete examples of how your AI will respond in different situations:
        </p>

        {examples.map((example, idx) => (
          <div
            key={idx}
            className="rounded-lg border bg-muted/50 p-4 space-y-2"
          >
            <p className="text-sm font-medium">
              <span className="text-muted-foreground">Scenario:</span> {example.scenario}
            </p>
            <div className="rounded bg-background p-3 text-sm">
              <span className="font-medium">AI Response:</span>{' '}
              <span className="text-muted-foreground">"{example.response}"</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {example.traits.filter(Boolean).map((trait, tidx) => (
                <Badge key={tidx} variant="outline" className="text-xs">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Decision Rules Summary */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <h4 className="text-sm font-semibold">Decision Framework</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <strong>When uncertain:</strong> {identity.decision_rules.when_uncertain}
          </li>
          <li>
            <strong>Information handling:</strong> {identity.decision_rules.information_handling}
          </li>
          <li>
            <strong>Tone:</strong> {identity.decision_rules.tone_approach}
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onEdit}>
          ← Let me adjust
        </Button>
        <Button onClick={onNext}>
          Test Drive This Identity →
        </Button>
      </div>
    </div>
  )
}
