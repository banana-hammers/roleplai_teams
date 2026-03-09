'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Loader2 } from 'lucide-react'
import { saveLoreEntries } from '@/app/actions/lore'
import type { LoreType } from '@/types/identity'

interface LoreEntry {
  name: string
  content: string
  type: LoreType
}

interface LoreSummaryProps {
  companyName: string
  entries: LoreEntry[]
  onNext: () => void
  onBack: () => void
}

const TYPE_LABELS: Record<LoreType, string> = {
  bio: 'Bio',
  brand: 'Brand',
  rules: 'Rules',
  custom: 'Custom',
}

const TYPE_COLORS: Record<LoreType, string> = {
  bio: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  brand: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  rules: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  custom: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
}

export function LoreSummary({ companyName, entries, onNext, onBack }: LoreSummaryProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const grouped = entries.reduce<Record<LoreType, LoreEntry[]>>((acc, entry) => {
    if (!acc[entry.type]) acc[entry.type] = []
    acc[entry.type].push(entry)
    return acc
  }, {} as Record<LoreType, LoreEntry[]>)

  const handleSaveAndContinue = async () => {
    setSaving(true)
    setError(null)

    try {
      const result = await saveLoreEntries(entries)
      if (result.success) {
        onNext()
      } else {
        setError(result.error || 'Failed to save lore entries')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Your Company Lore
          </h2>
        </div>
        <p className="text-muted-foreground">
          Here&apos;s what I captured about <span className="font-medium text-foreground">{companyName}</span>. Review and save to continue.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {/* Grouped entries */}
      <div className="space-y-4">
        {(Object.keys(grouped) as LoreType[]).map(type => (
          <div key={type} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {TYPE_LABELS[type]}
            </h3>
            {grouped[type].map((entry, idx) => (
              <div
                key={idx}
                className="rounded-lg border bg-muted/50 p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{entry.name}</span>
                  <Badge variant="outline" className={`text-xs ${TYPE_COLORS[entry.type]}`}>
                    {TYPE_LABELS[entry.type]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No lore entries were extracted. You can add them manually later in Settings.
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack}>
          &larr; Back to Interview
        </Button>
        <Button onClick={handleSaveAndContinue} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {saving ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}
