'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'

interface IdentityFacets {
  tone_adjustment?: string
  priority_override?: string[]
  special_behaviors?: string[]
}

interface IdentityFacetsEditorProps {
  facets: IdentityFacets
  onChange: (facets: IdentityFacets) => void
}

export function IdentityFacetsEditor({ facets, onChange }: IdentityFacetsEditorProps) {
  const [newPriority, setNewPriority] = useState('')
  const [newBehavior, setNewBehavior] = useState('')

  const handleToneChange = (value: string) => {
    onChange({ ...facets, tone_adjustment: value })
  }

  const addPriority = () => {
    if (!newPriority.trim()) return
    const current = facets.priority_override || []
    onChange({ ...facets, priority_override: [...current, newPriority.trim()] })
    setNewPriority('')
  }

  const removePriority = (index: number) => {
    const current = facets.priority_override || []
    onChange({ ...facets, priority_override: current.filter((_, i) => i !== index) })
  }

  const addBehavior = () => {
    if (!newBehavior.trim()) return
    const current = facets.special_behaviors || []
    onChange({ ...facets, special_behaviors: [...current, newBehavior.trim()] })
    setNewBehavior('')
  }

  const removeBehavior = (index: number) => {
    const current = facets.special_behaviors || []
    onChange({ ...facets, special_behaviors: current.filter((_, i) => i !== index) })
  }

  const handleKeyDown = (
    e: React.KeyboardEvent,
    action: () => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  return (
    <div className="space-y-6">
      {/* Tone Adjustment */}
      <div className="space-y-2">
        <Label htmlFor="tone_adjustment">Tone Adjustment</Label>
        <Input
          id="tone_adjustment"
          value={facets.tone_adjustment || ''}
          onChange={(e) => handleToneChange(e.target.value)}
          placeholder="e.g., Professional yet approachable, Casual and friendly"
        />
        <p className="text-xs text-muted-foreground">
          How this role&apos;s communication style differs from your identity core.
        </p>
      </div>

      {/* Priority Overrides */}
      <div className="space-y-2">
        <Label>Priority Overrides</Label>
        <p className="text-xs text-muted-foreground">
          Priorities specific to this role that override your identity core defaults.
        </p>

        {(facets.priority_override?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {facets.priority_override?.map((priority, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {priority}
                <button
                  type="button"
                  onClick={() => removePriority(index)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, addPriority)}
            placeholder="Add a priority override..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addPriority}
            disabled={!newPriority.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Special Behaviors */}
      <div className="space-y-2">
        <Label>Special Behaviors</Label>
        <p className="text-xs text-muted-foreground">
          Unique behaviors or rules this role should follow.
        </p>

        {(facets.special_behaviors?.length ?? 0) > 0 && (
          <div className="space-y-2">
            {facets.special_behaviors?.map((behavior, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <span className="text-sm">{behavior}</span>
                <button
                  type="button"
                  onClick={() => removeBehavior(index)}
                  className="rounded-full p-1 hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newBehavior}
            onChange={(e) => setNewBehavior(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, addBehavior)}
            placeholder="Add a special behavior..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addBehavior}
            disabled={!newBehavior.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
