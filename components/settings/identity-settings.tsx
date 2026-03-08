'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStatusMessage } from '@/lib/hooks/use-status-message'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { IdentityReInterview } from './identity-re-interview'
import {
  updateIdentityCore,
  replaceIdentityCore,
  type UpdateIdentityCoreData,
} from '@/app/actions/identity'
import type { IdentityCore, StyleProfile, CognitiveStyle, RefinementEntry } from '@/types/identity'
import { StatusMessage } from './status-message'
import {
  Pencil,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  History,
  PenLine,
  Brain,
} from 'lucide-react'
import {
  VOICE_TYPES,
  VOICE_DESCRIPTIONS,
  VOICE_FINGERPRINTS,
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

const VOICE_DISPLAY_LABELS: Record<VoiceType, string> = {
  direct_concise: 'Direct & Concise',
  direct_respectful: 'Direct & Respectful',
  warm_conversational: 'Warm & Conversational',
  analytical_precise: 'Analytical & Precise',
  playful_creative: 'Playful & Creative',
  calm_thoughtful: 'Calm & Thoughtful',
  energetic_enthusiastic: 'Energetic & Enthusiastic',
}

type EditingSection = 'voice' | 'values' | 'code' | 'style' | 'cognitive' | null

interface IdentitySettingsProps {
  identityCore: IdentityCore | null
}

export function IdentitySettings({ identityCore }: IdentitySettingsProps) {
  const router = useRouter()
  const [editingSection, setEditingSection] = useState<EditingSection>(null)
  const [isSaving, setIsSaving] = useState(false)
  const { statusMessage: message, setStatusMessage: setMessage } = useStatusMessage(3000)

  // Local edit state
  const [editVoice, setEditVoice] = useState('')
  const [editPriorities, setEditPriorities] = useState<string[]>([])
  const [editBoundaries, setEditBoundaries] = useState<Record<string, boolean | string[]>>({})
  const [newCustomBoundary, setNewCustomBoundary] = useState('')

  // Style & cognitive edit state
  const [editStyleProfile, setEditStyleProfile] = useState<StyleProfile>({})
  const [editCognitiveStyle, setEditCognitiveStyle] = useState<CognitiveStyle>({})
  const [showRefinementLog, setShowRefinementLog] = useState(false)

  // Re-interview state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showReInterview, setShowReInterview] = useState(false)

  if (!identityCore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Identity Core</CardTitle>
          <CardDescription>
            The soul behind every RoleplAIr you create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="font-semibold">No Identity Core Found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                You haven&apos;t created an identity core yet. Complete the
                onboarding interview with Nova to create your identity.
              </p>
            </div>
            <Button asChild>
              <a href="/onboarding">Start Onboarding</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const voice = identityCore.voice as string
  const priorities = (identityCore.priorities as string[]) || []
  const boundaries = identityCore.boundaries as Record<string, boolean | string[]>

  // Detect voice type from stored voice string
  const detectedVoiceType = VOICE_TYPES.find(
    (vt) => voice === vt || voice.toLowerCase().includes(vt.replace(/_/g, ' '))
  ) || VOICE_TYPES.find(
    (vt) => VOICE_DESCRIPTIONS[vt].toLowerCase().startsWith(voice.toLowerCase().split('.')[0])
  )

  const startEditing = (section: EditingSection) => {
    if (section === 'voice') setEditVoice(voice)
    if (section === 'values') setEditPriorities([...priorities])
    if (section === 'code') {
      setEditBoundaries({ ...boundaries })
      setNewCustomBoundary('')
    }
    if (section === 'style') setEditStyleProfile({ ...(identityCore.style_profile as StyleProfile || {}) })
    if (section === 'cognitive') setEditCognitiveStyle({ ...(identityCore.cognitive_style as CognitiveStyle || {}) })
    setEditingSection(section)
    setMessage(null)
  }

  const cancelEditing = () => {
    setEditingSection(null)
  }

  const saveSection = async () => {
    setIsSaving(true)
    setMessage(null)

    const data: UpdateIdentityCoreData = {}
    if (editingSection === 'voice') data.voice = editVoice
    if (editingSection === 'values') data.priorities = editPriorities
    if (editingSection === 'code') data.boundaries = editBoundaries
    if (editingSection === 'style') data.style_profile = editStyleProfile
    if (editingSection === 'cognitive') data.cognitive_style = editCognitiveStyle

    const result = await updateIdentityCore(data)

    if (result.success) {
      setMessage({ type: 'success', text: 'Identity updated successfully!' })
      setEditingSection(null)
      router.refresh()
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to update identity',
      })
    }

    setIsSaving(false)
  }

  const handleSaveReInterview = async (data: UpdateIdentityCoreData) => {
    setIsSaving(true)
    setMessage(null)

    const result = await replaceIdentityCore(data)

    if (result.success) {
      setMessage({ type: 'success', text: 'Identity replaced successfully!' })
      setShowReInterview(false)
      router.refresh()
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to replace identity',
      })
    }

    setIsSaving(false)
  }

  // Values edit helpers
  const availablePriorities = PRIORITY_VALUES.filter(
    (p) => !editPriorities.includes(p)
  )

  const addPriority = (p: PriorityValue) => {
    if (editPriorities.length >= 3) return
    setEditPriorities((prev) => [...prev, p])
  }

  const removePriority = (p: string) => {
    setEditPriorities((prev) => prev.filter((v) => v !== p))
  }

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= editPriorities.length) return
    setEditPriorities((prev) => {
      const arr = [...prev]
      ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
      return arr
    })
  }

  // Boundaries edit helpers
  const toggleBoundary = (key: BoundaryType) => {
    setEditBoundaries((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const addCustomBoundary = () => {
    if (!newCustomBoundary.trim()) return
    const current = (editBoundaries.custom as string[]) || []
    setEditBoundaries((prev) => ({
      ...prev,
      custom: [...current, newCustomBoundary.trim()],
    }))
    setNewCustomBoundary('')
  }

  const removeCustomBoundary = (index: number) => {
    const current = (editBoundaries.custom as string[]) || []
    setEditBoundaries((prev) => ({
      ...prev,
      custom: current.filter((_, i) => i !== index),
    }))
  }

  if (showReInterview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Re-Interview with Nova</CardTitle>
          <CardDescription>
            Start a fresh conversation to rebuild your identity core
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IdentityReInterview
            onComplete={handleSaveReInterview}
            onCancel={() => setShowReInterview(false)}
          />
        </CardContent>
      </Card>
    )
  }

  const customBoundaries = (boundaries.custom as string[]) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Identity Core</CardTitle>
        <CardDescription>
          The soul behind every RoleplAIr you create
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatusMessage message={message} />

        {/* Voice Section */}
        <div
          className={`rounded-xl bg-card/80 backdrop-blur-sm border-l-4 border-l-amber-500 border border-border p-4 transition-all duration-300 ${
            editingSection === 'voice' ? 'ring-2 ring-amber-500/30' : 'hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-500">
              How You Speak
            </h3>
            {editingSection !== 'voice' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditing('voice')}
                disabled={editingSection !== null}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveSection}
                  disabled={isSaving}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {editingSection !== 'voice' ? (
            // Display mode
            <div className="space-y-2">
              <p className="font-medium">
                {detectedVoiceType
                  ? `"${VOICE_DISPLAY_LABELS[detectedVoiceType]}"`
                  : `"${voice}"`}
              </p>
              <p className="text-sm text-muted-foreground">
                {detectedVoiceType
                  ? VOICE_DESCRIPTIONS[detectedVoiceType]
                  : voice}
              </p>
              {detectedVoiceType && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-xs text-muted-foreground">Signature:</span>
                  {VOICE_FINGERPRINTS[detectedVoiceType].vocabulary.signature.slice(0, 3).map((phrase) => (
                    <span
                      key={phrase}
                      className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Edit mode - selectable cards
            <div className="grid gap-2 sm:grid-cols-2">
              {VOICE_TYPES.map((vt) => (
                <button
                  key={vt}
                  type="button"
                  onClick={() => setEditVoice(vt)}
                  className={`text-left rounded-lg border p-3 transition-all ${
                    editVoice === vt
                      ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                      : 'border-border hover:border-amber-500/50 hover:bg-muted/50'
                  }`}
                >
                  <p className="font-medium text-sm">{VOICE_DISPLAY_LABELS[vt]}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {VOICE_DESCRIPTIONS[vt].split('.')[0]}.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {VOICE_FINGERPRINTS[vt].vocabulary.signature.slice(0, 2).map((phrase) => (
                      <span
                        key={phrase}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {phrase}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Values Section */}
        <div
          className={`rounded-xl bg-card/80 backdrop-blur-sm border-l-4 border-l-indigo-400 border border-border p-4 transition-all duration-300 ${
            editingSection === 'values' ? 'ring-2 ring-indigo-400/30' : 'hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
              What Drives You
            </h3>
            {editingSection !== 'values' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditing('values')}
                disabled={editingSection !== null}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveSection}
                  disabled={isSaving || editPriorities.length === 0}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {editingSection !== 'values' ? (
            // Display mode
            <div className="space-y-2">
              {priorities.map((p, i) => (
                <div key={p} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-400/20 text-xs font-bold text-indigo-400">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium text-sm capitalize">
                      {PRIORITY_LABELS[p as PriorityValue] || p}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      &mdash; {PRIORITY_DESCRIPTIONS[p as PriorityValue] || p}
                    </span>
                  </div>
                </div>
              ))}
              {priorities.length === 0 && (
                <p className="text-sm text-muted-foreground">No values set</p>
              )}
            </div>
          ) : (
            // Edit mode
            <div className="space-y-3">
              {/* Current ranked */}
              {editPriorities.length > 0 && (
                <div className="space-y-1.5">
                  {editPriorities.map((p, i) => (
                    <div
                      key={p}
                      className="flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-400/5 px-3 py-2"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-400 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium flex-1 capitalize">
                        {PRIORITY_LABELS[p as PriorityValue] || p}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => movePriority(i, 'up')}
                          disabled={i === 0}
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePriority(i, 'down')}
                          disabled={i === editPriorities.length - 1}
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePriority(p)}
                          className="p-0.5 rounded hover:bg-muted ml-1"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Available pool */}
              {editPriorities.length < 3 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    Add values ({3 - editPriorities.length} remaining)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availablePriorities.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => addPriority(p)}
                        title={PRIORITY_DESCRIPTIONS[p]}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-border hover:border-indigo-400/50 hover:bg-indigo-400/5 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Boundaries Section */}
        <div
          className={`rounded-xl bg-card/80 backdrop-blur-sm border-l-4 border-l-teal-500 border border-border p-4 transition-all duration-300 ${
            editingSection === 'code' ? 'ring-2 ring-teal-500/30' : 'hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-500">
              Your Code
            </h3>
            {editingSection !== 'code' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditing('code')}
                disabled={editingSection !== null}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={isSaving}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveSection}
                  disabled={isSaving}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {editingSection !== 'code' ? (
            // Display mode - 2-column grid of all 8 boundaries
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {BOUNDARY_TYPES.map((b) => {
                  const active = boundaries[b] === true
                  return (
                    <div
                      key={b}
                      className={`flex items-center gap-2 text-sm ${
                        active ? '' : 'opacity-40'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${
                          active ? 'text-teal-500' : 'text-muted-foreground'
                        }`}
                      />
                      <span>{BOUNDARY_LABELS[b]}</span>
                    </div>
                  )
                })}
              </div>
              {customBoundaries.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Custom:</span>{' '}
                  {customBoundaries.map((c, i) => (
                    <span key={i}>
                      &ldquo;{c}&rdquo;
                      {i < customBoundaries.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Edit mode - toggle cards
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BOUNDARY_TYPES.map((b) => {
                  const active = editBoundaries[b] === true
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBoundary(b)}
                      title={BOUNDARY_DESCRIPTIONS[b]}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-all ${
                        active
                          ? 'border-teal-500/50 bg-teal-500/10'
                          : 'border-border hover:border-teal-500/30 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${
                          active ? 'text-teal-500' : 'text-muted-foreground'
                        }`}
                      />
                      <span className="font-medium">{BOUNDARY_LABELS[b]}</span>
                    </button>
                  )
                })}
              </div>

              {/* Custom boundaries */}
              <div className="space-y-2 pt-1">
                {((editBoundaries.custom as string[]) || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {((editBoundaries.custom as string[]) || []).map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => removeCustomBoundary(i)}
                          className="rounded-full p-0.5 hover:bg-teal-500/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newCustomBoundary}
                    onChange={(e) => setNewCustomBoundary(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomBoundary()
                      }
                    }}
                    placeholder="Add custom boundary..."
                    maxLength={100}
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
          )}
        </div>

        {/* Writing Style Section */}
        <div
          className={`rounded-xl bg-card/80 backdrop-blur-sm border-l-4 border-l-rose-500 border border-border p-4 transition-all duration-300 ${
            editingSection === 'style' ? 'ring-2 ring-rose-500/30' : 'hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              Writing Style
            </h3>
            {editingSection !== 'style' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditing('style')}
                disabled={editingSection !== null}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={isSaving}>
                  <X className="h-3.5 w-3.5 mr-1" />Cancel
                </Button>
                <Button size="sm" onClick={saveSection} disabled={isSaving}>
                  <Check className="h-3.5 w-3.5 mr-1" />{isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {editingSection !== 'style' ? (
            <div className="space-y-2">
              {(() => {
                const sp = identityCore.style_profile as StyleProfile | null
                if (!sp || Object.keys(sp).length === 0) {
                  return <p className="text-sm text-muted-foreground">No writing style data yet. Complete a writing sample or chat to build this.</p>
                }
                return (
                  <div className="flex flex-wrap gap-2">
                    {sp.sentence_length && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400">{sp.sentence_length} sentences</span>}
                    {sp.vocabulary_level && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400">{sp.vocabulary_level} vocabulary</span>}
                    {sp.formality && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400">{sp.formality} tone</span>}
                    {sp.tone_markers?.map(m => <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400">{m}</span>)}
                    {sp.signature_phrases && sp.signature_phrases.length > 0 && (
                      <div className="w-full text-xs text-muted-foreground mt-1">
                        Phrases: {sp.signature_phrases.map(p => `"${p}"`).join(', ')}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sentence Length</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(['short', 'medium', 'long', 'varied'] as const).map(v => (
                    <button key={v} type="button" onClick={() => setEditStyleProfile(p => ({ ...p, sentence_length: v }))}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${editStyleProfile.sentence_length === v ? 'border-rose-500 bg-rose-500/10' : 'border-border hover:border-rose-500/50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Vocabulary</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(['simple', 'moderate', 'advanced', 'technical'] as const).map(v => (
                    <button key={v} type="button" onClick={() => setEditStyleProfile(p => ({ ...p, vocabulary_level: v }))}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${editStyleProfile.vocabulary_level === v ? 'border-rose-500 bg-rose-500/10' : 'border-border hover:border-rose-500/50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Formality</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(['casual', 'balanced', 'formal', 'professional'] as const).map(v => (
                    <button key={v} type="button" onClick={() => setEditStyleProfile(p => ({ ...p, formality: v }))}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${editStyleProfile.formality === v ? 'border-rose-500 bg-rose-500/10' : 'border-border hover:border-rose-500/50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Thinking Style Section */}
        <div
          className={`rounded-xl bg-card/80 backdrop-blur-sm border-l-4 border-l-purple-500 border border-border p-4 transition-all duration-300 ${
            editingSection === 'cognitive' ? 'ring-2 ring-purple-500/30' : 'hover:shadow-lg'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-500 flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5" />
              Thinking Style
            </h3>
            {editingSection !== 'cognitive' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditing('cognitive')}
                disabled={editingSection !== null}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={isSaving}>
                  <X className="h-3.5 w-3.5 mr-1" />Cancel
                </Button>
                <Button size="sm" onClick={saveSection} disabled={isSaving}>
                  <Check className="h-3.5 w-3.5 mr-1" />{isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {editingSection !== 'cognitive' ? (
            <div className="space-y-2">
              {(() => {
                const cs = identityCore.cognitive_style as CognitiveStyle | null
                if (!cs || Object.keys(cs).length === 0) {
                  return <p className="text-sm text-muted-foreground">No thinking style data yet. Complete the interview or chat to build this.</p>
                }
                return (
                  <div className="flex flex-wrap gap-2">
                    {cs.decision_approach && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400">{cs.decision_approach} decisions</span>}
                    {cs.uncertainty_response && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400">{cs.uncertainty_response.replace(/_/g, ' ')} under uncertainty</span>}
                    {cs.explanation_preference && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400">{cs.explanation_preference.replace(/_/g, ' ')}</span>}
                    {cs.feedback_style && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400">{cs.feedback_style} feedback</span>}
                    {cs.context_need && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400">{cs.context_need} context</span>}
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Decision Approach</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(['intuitive', 'analytical', 'collaborative', 'decisive'] as const).map(v => (
                    <button key={v} type="button" onClick={() => setEditCognitiveStyle(p => ({ ...p, decision_approach: v }))}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${editCognitiveStyle.decision_approach === v ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Under Uncertainty</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(['explore', 'research', 'ask_others', 'make_best_guess'] as const).map(v => (
                    <button key={v} type="button" onClick={() => setEditCognitiveStyle(p => ({ ...p, uncertainty_response: v }))}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${editCognitiveStyle.uncertainty_response === v ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/50'}`}>
                      {v.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Explanation Preference</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(['big_picture_first', 'details_first', 'examples_first', 'analogies'] as const).map(v => (
                    <button key={v} type="button" onClick={() => setEditCognitiveStyle(p => ({ ...p, explanation_preference: v }))}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${editCognitiveStyle.explanation_preference === v ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/50'}`}>
                      {v.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Feedback Style</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(['direct', 'sandwich', 'questions', 'supportive'] as const).map(v => (
                    <button key={v} type="button" onClick={() => setEditCognitiveStyle(p => ({ ...p, feedback_style: v }))}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${editCognitiveStyle.feedback_style === v ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Context Need</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(['minimal', 'moderate', 'comprehensive'] as const).map(v => (
                    <button key={v} type="button" onClick={() => setEditCognitiveStyle(p => ({ ...p, context_need: v }))}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${editCognitiveStyle.context_need === v ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Refinement History */}
        {(() => {
          const log = (identityCore.refinement_log as RefinementEntry[] | null) || []
          if (log.length === 0) return null
          return (
            <div className="rounded-xl border border-border p-4">
              <button
                type="button"
                onClick={() => setShowRefinementLog(!showRefinementLog)}
                className="flex items-center gap-2 w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <History className="h-4 w-4" />
                <span>Refinement History ({log.length})</span>
                <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${showRefinementLog ? 'rotate-90' : ''}`} />
              </button>
              {showRefinementLog && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {log.slice().reverse().slice(0, 20).map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs border-l-2 border-muted pl-3 py-1">
                      <div className="flex-1">
                        <p className="text-foreground">{entry.correction}</p>
                        <p className="text-muted-foreground mt-0.5">
                          {new Date(entry.timestamp).toLocaleDateString()} via {entry.source.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Re-interview footer */}
        <div className="flex items-center justify-between rounded-xl border border-dashed border-border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>Want a fresh start?</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfirmDialog(true)}
            disabled={editingSection !== null}
          >
            Start Re-Interview
          </Button>
        </div>

        {/* Confirmation dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Start New Interview?
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>
                    This will start a fresh interview with Nova to rebuild your
                    identity core from scratch.
                  </p>
                  <p className="font-medium text-foreground">
                    Your current identity will be replaced after you confirm the
                    new one.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowConfirmDialog(false)
                  setShowReInterview(true)
                }}
              >
                Start Interview
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
