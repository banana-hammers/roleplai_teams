'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, PenLine } from 'lucide-react'

interface WritingSamplesProps {
  onSkip: () => void
  onAnalyze: (samples: string[]) => void
  loading?: boolean
}

export function WritingSamples({ onSkip, onAnalyze, loading = false }: WritingSamplesProps) {
  const [text, setText] = useState('')

  const isValid = text.trim().length >= 100

  const handleAnalyze = () => {
    const samples = text
      .split(/\n{2,}/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
    onAnalyze(samples.length > 0 ? samples : [text.trim()])
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <PenLine className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Optional: Share Your Writing
          </h2>
        </div>
        <p className="text-muted-foreground">
          Paste 2-3 things you&apos;ve written for a more accurate style profile
        </p>
      </div>

      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 3000))}
          placeholder="Paste emails, messages, notes, or anything you've written. Separate samples with blank lines..."
          className="min-h-[200px] resize-y"
          disabled={loading}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{text.length < 100 ? `${100 - text.length} more characters needed` : 'Ready to analyze'}</span>
          <span>{text.length}/3000</span>
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onSkip} disabled={loading}>
          Skip
        </Button>
        <Button onClick={handleAnalyze} disabled={!isValid || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze My Writing'
          )}
        </Button>
      </div>
    </div>
  )
}
