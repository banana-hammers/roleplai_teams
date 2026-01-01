'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IdentityCoreEditor } from './identity-core-editor'
import { IdentityReInterview } from './identity-re-interview'
import {
  updateIdentityCore,
  replaceIdentityCore,
  type UpdateIdentityCoreData,
} from '@/app/actions/identity'
import type { IdentityCore } from '@/types/identity'
import { Pencil, MessageSquare, CheckCircle2, Sparkles } from 'lucide-react'

interface IdentitySettingsProps {
  identityCore: IdentityCore | null
}

export function IdentitySettings({ identityCore }: IdentitySettingsProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'reinterview'>('edit')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [showReInterview, setShowReInterview] = useState(false)

  // If no identity core exists, show a message
  if (!identityCore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identity Core</CardTitle>
          <CardDescription>
            Your identity core defines how your AI agents communicate and behave.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="font-semibold">No Identity Core Found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                You haven't created an identity core yet. Complete the
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

  // Transform identity core to editor format
  const editorData: UpdateIdentityCoreData = {
    voice: identityCore.voice,
    priorities: identityCore.priorities as string[],
    boundaries: identityCore.boundaries as Record<string, boolean | string[]>,
  }

  const handleSaveEdit = async (data: UpdateIdentityCoreData) => {
    setIsSaving(true)
    setMessage(null)

    const result = await updateIdentityCore(data)

    if (result.success) {
      setMessage({ type: 'success', text: 'Identity updated successfully!' })
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
      setMessage({
        type: 'success',
        text: 'Identity replaced successfully!',
      })
      setShowReInterview(false)
      setActiveTab('edit')
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to replace identity',
      })
    }

    setIsSaving(false)
  }

  const handleCancelReInterview = () => {
    setShowReInterview(false)
    setActiveTab('edit')
  }

  // Get ranked priorities for summary (now an ordered array)
  const rankedPriorities = (identityCore.priorities as string[]) || []

  // Get active boundaries for summary
  const activeBoundaries = Object.entries(identityCore.boundaries)
    .filter(([key, value]) => key !== 'custom' && value === true)
    .map(([name]) => name.replace(/_/g, ' '))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Core</CardTitle>
        <CardDescription>
          Your identity core defines how your AI agents communicate and behave.
          Edit manually or re-interview with Nova for a fresh start.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success/Error Message */}
        {message && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              message.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100'
                : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Current Identity Summary (collapsed view) */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Current Identity
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Voice</p>
              <p className="text-sm truncate">{identityCore.voice}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Core Values</p>
              <div className="flex flex-wrap gap-1">
                {rankedPriorities.map((priority, index) => (
                  <Badge
                    key={priority}
                    variant={index === 0 ? 'default' : 'secondary'}
                    className="capitalize text-xs"
                  >
                    {index + 1}. {priority}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Boundaries</p>
              <div className="flex flex-wrap gap-2">
                {activeBoundaries.slice(0, 3).map((boundary) => (
                  <span
                    key={boundary}
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="capitalize">{boundary}</span>
                  </span>
                ))}
                {activeBoundaries.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{activeBoundaries.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Mode Tabs */}
        {!showReInterview ? (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'edit' | 'reinterview')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit Manually
              </TabsTrigger>
              <TabsTrigger
                value="reinterview"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Re-interview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="mt-6">
              <IdentityCoreEditor
                initialData={editorData}
                onSave={handleSaveEdit}
                isSaving={isSaving}
              />
            </TabsContent>

            <TabsContent value="reinterview" className="mt-6">
              <div className="space-y-4 text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="font-semibold">Interview with Nova</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Start a fresh conversation with Nova to rebuild your
                    identity core. This will replace your current identity after
                    you confirm the new one.
                  </p>
                </div>
                <Button onClick={() => setShowReInterview(true)}>
                  Start Re-Interview
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <IdentityReInterview
            onComplete={handleSaveReInterview}
            onCancel={handleCancelReInterview}
          />
        )}
      </CardContent>
    </Card>
  )
}
