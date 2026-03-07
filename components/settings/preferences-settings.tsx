'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatusMessage } from './status-message'
import { AVAILABLE_MODELS } from '@/lib/utils/model-tiers'

const STORAGE_KEY = 'roleplai-preferences'
const DEFAULTS = {
  defaultModel: 'anthropic/claude-sonnet-4-6',
  defaultApprovalPolicy: 'smart',
}

export function PreferencesSettings() {
  const [defaultModel, setDefaultModel] = useState(DEFAULTS.defaultModel)
  const [defaultApprovalPolicy, setDefaultApprovalPolicy] = useState(DEFAULTS.defaultApprovalPolicy)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.defaultModel) setDefaultModel(parsed.defaultModel)
        if (parsed.defaultApprovalPolicy) setDefaultApprovalPolicy(parsed.defaultApprovalPolicy)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  const savePreferences = (model: string, policy: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        defaultModel: model,
        defaultApprovalPolicy: policy,
      }))
      setMessage({ type: 'success', text: 'Preferences saved' })
      setTimeout(() => setMessage(null), 2000)
    } catch {
      setMessage({ type: 'error', text: 'Failed to save preferences' })
    }
  }

  const handleModelChange = (value: string) => {
    setDefaultModel(value)
    savePreferences(value, defaultApprovalPolicy)
  }

  const handlePolicyChange = (value: string) => {
    setDefaultApprovalPolicy(value)
    savePreferences(defaultModel, value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Set your default preferences for new roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Default Model</Label>
          <Select value={defaultModel} onValueChange={handleModelChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center gap-2">
                    <span>{model.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {model.value.split('/')[0] === 'anthropic' ? 'Anthropic' : 'OpenAI'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This model will be used by default when creating new roles.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Default Approval Policy</Label>
          <Select value={defaultApprovalPolicy} onValueChange={handlePolicyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">
                <div>
                  <span className="font-medium">Always Ask</span>
                  <p className="text-xs text-muted-foreground">
                    Require approval for all tool uses
                  </p>
                </div>
              </SelectItem>
              <SelectItem value="smart">
                <div>
                  <span className="font-medium">Smart</span>
                  <p className="text-xs text-muted-foreground">
                    Auto-approve safe operations, ask for risky ones
                  </p>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <StatusMessage message={message} />

        <p className="text-xs text-muted-foreground">
          These preferences apply to newly created roles. Existing roles keep their current settings.
        </p>
      </CardContent>
    </Card>
  )
}
