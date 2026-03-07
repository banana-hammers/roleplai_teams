'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { StatusMessage } from './status-message'
import { Trash2, Plus, Eye, EyeOff, CheckCircle } from 'lucide-react'

interface ApiKeysSettingsProps {
  apiKeys: Array<{
    id: string
    provider: string
    label: string | null
    created_at: string
  }>
}

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { value: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
]

export function ApiKeysSettings({ apiKeys: initialKeys }: ApiKeysSettingsProps) {
  const [apiKeys, setApiKeys] = useState(initialKeys)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKey, setNewKey] = useState({ provider: '', key: '', label: '' })
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)
  const [verifiedKeyId, setVerifiedKeyId] = useState<string | null>(null)

  const handleAddKey = async () => {
    if (!newKey.provider || !newKey.key) return

    setSaving(true)
    setMessage(null)

    try {
      // Use server-side API for encryption
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newKey.provider,
          key: newKey.key,
          label: newKey.label || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add API key')
      }

      const data = await response.json()

      setApiKeys([...apiKeys, data])
      setNewKey({ provider: '', key: '', label: '' })
      setShowAddForm(false)
      setVerifiedKeyId(data.id)
      setMessage({ type: 'success', text: 'API key added and encrypted successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to add API key' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }

      setApiKeys(apiKeys.filter(k => k.id !== id))
      setDeletingKeyId(null)
      setMessage({ type: 'success', text: 'API key deleted' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete API key' })
      setDeletingKeyId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Add your own API keys to use with your roles. Keys are encrypted and stored securely.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing keys */}
        {apiKeys.length > 0 ? (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {key.provider}
                  </Badge>
                  <span className="text-sm">
                    {key.label || 'Unnamed key'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Added {new Date(key.created_at).toLocaleDateString()}
                  </span>
                  {verifiedKeyId === key.id && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
                <AlertDialog open={deletingKeyId === key.id} onOpenChange={(open) => !open && setDeletingKeyId(null)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingKeyId(key.id)}
                      className="self-end sm:self-auto"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete API key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your {key.provider} API key{key.label ? ` "${key.label}"` : ''}. Your roles will fall back to system keys.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteKey(key.id)} className="bg-destructive text-white hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No API keys configured. Add your own keys to use with your roles.
          </p>
        )}

        {/* Add key form */}
        {showAddForm ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={newKey.provider}
                onValueChange={(value) => setNewKey({ ...newKey, provider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={newKey.key}
                  onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                  placeholder={PROVIDERS.find(p => p.value === newKey.provider)?.placeholder || 'Enter API key'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input
                value={newKey.label}
                onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
                placeholder="e.g., Personal, Work"
                maxLength={50}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddKey} disabled={saving || !newKey.provider || !newKey.key}>
                {saving ? 'Adding...' : 'Add Key'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add API Key
          </Button>
        )}

        <StatusMessage message={message} />
      </CardContent>
    </Card>
  )
}
