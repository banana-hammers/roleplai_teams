'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validateAliasFormat, generateAliasSuggestions } from '@/lib/validation/alias'
import { Check, X, Loader2 } from 'lucide-react'

interface AliasNameProps {
  initialValue?: string
  onNext: (alias: string) => void
  onBack?: () => void
}

export function AliasName({ initialValue = '', onNext, onBack }: AliasNameProps) {
  const [alias, setAlias] = useState(initialValue)
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Debounced alias check
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!alias) {
        setAvailable(null)
        setError(null)
        setSuggestions([])
        return
      }

      // Validate format first
      const validation = validateAliasFormat(alias)
      if (!validation.isValid) {
        setError(validation.error || null)
        setAvailable(null)
        setSuggestions([])
        return
      }

      // Check availability
      setError(null)
      setChecking(true)

      try {
        const response = await fetch(`/api/check-alias?alias=${encodeURIComponent(alias)}`)
        const data = await response.json()

        if (response.ok) {
          setAvailable(data.available)
          if (!data.available) {
            setSuggestions(generateAliasSuggestions(alias))
          } else {
            setSuggestions([])
          }
        } else {
          setError(data.error || 'Failed to check alias')
        }
      } catch (err) {
        console.error('Error checking alias:', err)
        setError('Failed to check alias availability')
      } finally {
        setChecking(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [alias])

  const handleNext = () => {
    if (available && alias) {
      onNext(alias)
    }
  }

  const canProceed = available === true && !error

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Choose Your Alias
        </h2>
        <p className="text-muted-foreground">
          Every great identity starts with a name. What should we call you?
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="alias">Alias Name</Label>
          <div className="relative">
            <Input
              id="alias"
              type="text"
              placeholder="e.g. ryan_ai"
              value={alias}
              onChange={(e) => setAlias(e.target.value.toLowerCase())}
              className="pr-10"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-live="polite">
              {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Checking availability" />}
              {!checking && available === true && (
                <Check className="h-4 w-4 text-success" aria-label="Alias available" />
              )}
              {!checking && available === false && (
                <X className="h-4 w-4 text-destructive" aria-label="Alias taken" />
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            3-20 characters, letters, numbers, and underscores only. Lowercase only.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {available === false && suggestions.length > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
            <p className="text-sm font-medium mb-2">That alias is taken. Try these:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setAlias(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {available === true && (
          <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            <Check className="inline h-4 w-4 mr-1" />
            @{alias} is available!
          </div>
        )}
      </div>

      <div className="flex justify-between gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="ml-auto"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
