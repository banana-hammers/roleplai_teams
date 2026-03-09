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
import { Badge } from '@/components/ui/badge'
import { StatusMessage } from './status-message'
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
import { LoremasterInterview } from '@/components/onboarding/loremaster-interview'
import { LoreSummary } from '@/components/onboarding/lore-summary'
import { saveLoreEntries, updateLoreEntry, deleteLoreEntry } from '@/app/actions/lore'
import type { Lore, LoreType } from '@/types/identity'
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  MessageSquare,
  Loader2,
} from 'lucide-react'

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

type ViewMode = 'list' | 'interview' | 'review'

interface LoreSettingsProps {
  lore: Lore[]
}

export function LoreSettings({ lore }: LoreSettingsProps) {
  const router = useRouter()
  const { statusMessage: message, setStatusMessage: setMessage } = useStatusMessage(3000)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editType, setEditType] = useState<LoreType>('custom')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Add new entry state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<LoreType>('custom')

  // Interview extraction state
  const [extractedLore, setExtractedLore] = useState<{ companyName: string; entries: Array<{ name: string; content: string; type: LoreType }> } | null>(null)
  const [extracting, setExtracting] = useState(false)

  const startEditing = (entry: Lore) => {
    setEditingId(entry.id)
    setEditName(entry.name)
    setEditContent(entry.content)
    setEditType(entry.type as LoreType)
  }

  const cancelEditing = () => {
    setEditingId(null)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    setIsSaving(true)

    const result = await updateLoreEntry(editingId, {
      name: editName,
      content: editContent,
      type: editType,
    })

    if (result.success) {
      setMessage({ type: 'success', text: 'Lore entry updated!' })
      setEditingId(null)
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update' })
    }

    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    setIsSaving(true)

    const result = await deleteLoreEntry(deleteConfirmId)

    if (result.success) {
      setMessage({ type: 'success', text: 'Lore entry deleted' })
      setDeleteConfirmId(null)
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete' })
    }

    setIsSaving(false)
  }

  const handleAddEntry = async () => {
    if (!newName.trim() || !newContent.trim()) return
    setIsSaving(true)

    const result = await saveLoreEntries([{ name: newName, content: newContent, type: newType }])

    if (result.success) {
      setMessage({ type: 'success', text: 'Lore entry added!' })
      setShowAddForm(false)
      setNewName('')
      setNewContent('')
      setNewType('custom')
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to add entry' })
    }

    setIsSaving(false)
  }

  const handleInterviewComplete = async (messages: Array<{ role: string; content: string }>) => {
    setExtracting(true)

    try {
      const response = await fetch('/api/onboarding/extract-lore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })

      if (response.ok) {
        const data = await response.json()
        setExtractedLore(data)
        setViewMode('review')
      } else {
        setMessage({ type: 'error', text: 'Failed to extract lore from interview' })
        setViewMode('list')
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong' })
      setViewMode('list')
    } finally {
      setExtracting(false)
    }
  }

  const handleReviewComplete = () => {
    setViewMode('list')
    setExtractedLore(null)
    setMessage({ type: 'success', text: 'Company lore saved!' })
    router.refresh()
  }

  // Interview mode
  if (viewMode === 'interview') {
    if (extracting) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Extracting company lore...</p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Loremaster Interview</CardTitle>
          <CardDescription>Tell the Loremaster about your company</CardDescription>
        </CardHeader>
        <CardContent>
          <LoremasterInterview
            onComplete={handleInterviewComplete}
            onBack={() => setViewMode('list')}
            onSkip={() => setViewMode('list')}
          />
        </CardContent>
      </Card>
    )
  }

  // Review mode
  if (viewMode === 'review' && extractedLore) {
    return (
      <Card>
        <CardContent className="pt-6">
          <LoreSummary
            companyName={extractedLore.companyName}
            entries={extractedLore.entries}
            onNext={handleReviewComplete}
            onBack={() => setViewMode('interview')}
          />
        </CardContent>
      </Card>
    )
  }

  // List mode
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Lore</CardTitle>
        <CardDescription>
          Knowledge about your company, founders, and business that your agents can reference
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatusMessage message={message} />

        {lore.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="font-semibold">No Lore Entries</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Add company details that your AI agents can reference.
                Run the Loremaster interview for a guided experience.
              </p>
            </div>
          </div>
        )}

        {/* Existing entries */}
        {lore.map(entry => (
          <div key={entry.id} className="rounded-lg border p-4 space-y-2">
            {editingId === entry.id ? (
              // Edit mode
              <div className="space-y-3">
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Entry name"
                />
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="Content"
                  className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
                />
                <div className="flex gap-1">
                  {(['bio', 'brand', 'rules', 'custom'] as LoreType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditType(t)}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        editType === t ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={isSaving}>
                    <X className="h-3.5 w-3.5 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                    <Check className="h-3.5 w-3.5 mr-1" /> {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              // Display mode
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{entry.name}</span>
                    <Badge variant="outline" className={`text-xs ${TYPE_COLORS[entry.type as LoreType]}`}>
                      {TYPE_LABELS[entry.type as LoreType]}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEditing(entry)} disabled={editingId !== null}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(entry.id)} disabled={editingId !== null}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
              </>
            )}
          </div>
        ))}

        {/* Add new entry form */}
        {showAddForm && (
          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Entry name (e.g., Company Overview)"
              autoFocus
            />
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Content"
              className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-1">
              {(['bio', 'brand', 'rules', 'custom'] as LoreType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    newType === t ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewName(''); setNewContent(''); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddEntry} disabled={isSaving || !newName.trim() || !newContent.trim()}>
                {isSaving ? 'Adding...' : 'Add Entry'}
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm || editingId !== null}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lore Entry
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('interview')}
            disabled={editingId !== null}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Run Loremaster Interview
          </Button>
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lore Entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this lore entry. Any roles referencing it will lose access to this knowledge.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
