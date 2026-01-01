'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X, GripVertical } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  VOICE_TYPES,
  VOICE_DESCRIPTIONS,
  PRIORITY_VALUES,
  PRIORITY_LABELS,
  PRIORITY_DESCRIPTIONS,
  BOUNDARY_TYPES,
  BOUNDARY_LABELS,
  BOUNDARY_DESCRIPTIONS,
  type VoiceType,
  type PriorityValue,
  type BoundaryType,
} from '@/lib/constants/interview-prompts'
import type { UpdateIdentityCoreData } from '@/app/actions/identity'

// Voice labels for dropdown
const VOICE_DISPLAY_LABELS: Record<VoiceType, string> = {
  direct_concise: 'Direct & Concise',
  direct_respectful: 'Direct & Respectful',
  warm_conversational: 'Warm & Conversational',
  analytical_precise: 'Analytical & Precise',
  playful_creative: 'Playful & Creative',
  calm_thoughtful: 'Calm & Thoughtful',
  energetic_enthusiastic: 'Energetic & Enthusiastic',
}

interface IdentityCoreEditorProps {
  initialData: UpdateIdentityCoreData
  onSave: (data: UpdateIdentityCoreData) => Promise<void>
  isSaving: boolean
}

// Compact draggable priority pill
function DraggablePriorityPill({
  id,
  rank,
  onRemove,
}: {
  id: string
  rank: number
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priority = id as PriorityValue

  return (
    <div
      ref={setNodeRef}
      style={style}
      title={PRIORITY_DESCRIPTIONS[priority]}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 pl-1 pr-2 py-1"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none p-0.5"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </button>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {rank}
      </span>
      <span className="text-sm font-medium">{PRIORITY_LABELS[priority]}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-primary/20"
        aria-label="Remove from ranking"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  )
}


export function IdentityCoreEditor({
  initialData,
  onSave,
  isSaving,
}: IdentityCoreEditorProps) {
  const [voice, setVoice] = useState(initialData.voice)
  const [rankedPriorities, setRankedPriorities] = useState<string[]>(
    initialData.priorities || []
  )
  const [boundaries, setBoundaries] = useState<Record<string, boolean | string[]>>(
    initialData.boundaries
  )
  const [newCustomBoundary, setNewCustomBoundary] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Available priorities (not yet ranked)
  const availablePriorities = PRIORITY_VALUES.filter(
    (p) => !rankedPriorities.includes(p)
  )

  const addToRanking = (priority: PriorityValue) => {
    if (rankedPriorities.length >= 3) return
    setRankedPriorities((prev) => [...prev, priority])
  }

  const removeFromRanking = (priority: string) => {
    setRankedPriorities((prev) => prev.filter((p) => p !== priority))
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setRankedPriorities((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const toggleBoundary = (key: BoundaryType) => {
    setBoundaries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const addCustomBoundary = () => {
    if (!newCustomBoundary.trim()) return
    const current = (boundaries.custom as string[]) || []
    setBoundaries((prev) => ({
      ...prev,
      custom: [...current, newCustomBoundary.trim()],
    }))
    setNewCustomBoundary('')
  }

  const removeCustomBoundary = (index: number) => {
    const current = (boundaries.custom as string[]) || []
    setBoundaries((prev) => ({
      ...prev,
      custom: current.filter((_, i) => i !== index),
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  const handleSave = () => {
    onSave({
      voice,
      priorities: rankedPriorities,
      boundaries,
    })
  }

  return (
    <div className="space-y-8">
      {/* Voice Section */}
      <div className="space-y-3">
        <Label>Communication Style</Label>
        <Select value={voice} onValueChange={setVoice}>
          <SelectTrigger>
            <SelectValue placeholder="Select a voice style" />
          </SelectTrigger>
          <SelectContent>
            {VOICE_TYPES.map((voiceType) => (
              <SelectItem key={voiceType} value={voiceType}>
                {VOICE_DISPLAY_LABELS[voiceType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {voice && (
          <p className="text-sm text-muted-foreground">
            {VOICE_DESCRIPTIONS[voice as VoiceType]}
          </p>
        )}
      </div>

      {/* Priorities Section - Compact Pills */}
      <div className="space-y-3">
        <div>
          <Label>Core Values (Top 3)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Select your top 3 priorities. Drag to reorder.
          </p>
        </div>

        {/* Ranked Priorities - Horizontal Row */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rankedPriorities}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-2 min-h-11 rounded-lg border border-dashed border-primary/50 p-2 bg-primary/5">
              {rankedPriorities.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-1">
                  Click values below to add
                </p>
              ) : (
                rankedPriorities.map((priority, index) => (
                  <DraggablePriorityPill
                    key={priority}
                    id={priority}
                    rank={index + 1}
                    onRemove={() => removeFromRanking(priority)}
                  />
                ))
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-background px-3 py-1 shadow-lg">
                <GripVertical className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {PRIORITY_LABELS[activeId as PriorityValue]}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Available Priorities - Flex Wrap Grid */}
        <div className="space-y-2">
          <Label className="text-xs font-normal text-muted-foreground">
            Available ({3 - rankedPriorities.length} remaining)
          </Label>
          <div className="flex flex-wrap gap-2">
            {availablePriorities.map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => addToRanking(priority)}
                disabled={rankedPriorities.length >= 3}
                title={PRIORITY_DESCRIPTIONS[priority]}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-border hover:bg-muted hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-3 w-3" />
                {PRIORITY_LABELS[priority]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Boundaries Section - Compact Grid */}
      <div className="space-y-3">
        <Label>Boundaries</Label>
        <p className="text-xs text-muted-foreground">
          What your AI should never do or always maintain.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BOUNDARY_TYPES.map((boundary) => (
            <label
              key={boundary}
              title={BOUNDARY_DESCRIPTIONS[boundary]}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
            >
              <Switch
                checked={boundaries[boundary] === true}
                onCheckedChange={() => toggleBoundary(boundary)}
              />
              <span className="text-sm font-medium">{BOUNDARY_LABELS[boundary]}</span>
            </label>
          ))}
        </div>

        {/* Custom Boundaries - Inline */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Custom:</span>
            {((boundaries.custom as string[]) || []).map((custom, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {custom}
                <button
                  type="button"
                  onClick={() => removeCustomBoundary(index)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {((boundaries.custom as string[]) || []).length === 0 && (
              <span className="text-xs text-muted-foreground">None added</span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCustomBoundary}
              onChange={(e) => setNewCustomBoundary(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, addCustomBoundary)}
              placeholder="Add custom boundary..."
              className="flex-1 h-9"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomBoundary}
              disabled={!newCustomBoundary.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )
}
