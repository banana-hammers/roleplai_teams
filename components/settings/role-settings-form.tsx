'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToolConfigSelector } from './tool-config-selector'
import { createClient } from '@/lib/supabase/client'

interface RoleSettingsFormProps {
  role: {
    id: string
    name: string
    description: string | null
    instructions: string
    approval_policy: string
    model_preference: string | null
    tool_config: Record<string, unknown> | null
  }
  mcpServers: Array<{
    id: string
    name: string
    server_type: string
    is_enabled: boolean | null
  }>
  roleSkills: Array<{
    skill_id: string
    config_overrides: Record<string, unknown> | null
    skills: { id: string; name: string; description: string } | null
  }>
  allSkills: Array<{
    id: string
    name: string
    description: string
    input_schema: Record<string, unknown> | null
  }>
}

const MODELS = [
  { value: 'anthropic/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
  { value: 'anthropic/claude-opus-4-20250514', label: 'Claude Opus 4' },
  { value: 'openai/gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
  { value: 'openai/gpt-4o', label: 'GPT-4o' },
]

export function RoleSettingsForm({ role, mcpServers, roleSkills, allSkills }: RoleSettingsFormProps) {
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description || '',
    instructions: role.instructions,
    approval_policy: role.approval_policy,
    model_preference: role.model_preference || 'anthropic/claude-sonnet-4-5-20250929',
    tool_config: role.tool_config || {},
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('roles')
        .update({
          name: formData.name,
          description: formData.description || null,
          instructions: formData.instructions,
          approval_policy: formData.approval_policy,
          model_preference: formData.model_preference,
          tool_config: formData.tool_config,
        })
        .eq('id', role.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Settings saved successfully' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="tools">Tools & Permissions</TabsTrigger>
        <TabsTrigger value="skills">Skills</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure the basic settings for this role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Role name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this role"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Detailed instructions for this role's behavior"
                rows={6}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={formData.model_preference}
                  onValueChange={(value) => setFormData({ ...formData, model_preference: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Approval Policy</Label>
                <Select
                  value={formData.approval_policy}
                  onValueChange={(value) => setFormData({ ...formData, approval_policy: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Always Ask</SelectItem>
                    <SelectItem value="smart">Smart</SelectItem>
                    <SelectItem value="never">Never Ask</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {message && (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}

            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tools">
        <ToolConfigSelector
          toolConfig={formData.tool_config}
          onChange={(config) => setFormData({ ...formData, tool_config: config })}
          onSave={handleSave}
          saving={saving}
        />
      </TabsContent>

      <TabsContent value="skills">
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              Skills this role can use. Manage skills from the role creation flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roleSkills.length > 0 ? (
              <div className="space-y-2">
                {roleSkills.map((rs) => (
                  <div
                    key={rs.skill_id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{rs.skills?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {rs.skills?.description}
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No skills assigned to this role.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
