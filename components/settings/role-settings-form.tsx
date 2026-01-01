'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User } from 'lucide-react'
import { IdentityFacetsEditor } from './identity-facets-editor'
import { ModelSelector } from './model-selector'
import { SkillsManager } from './skills-manager'
import { RoleMcpManager } from './role-mcp-manager'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { deleteRole } from '@/app/actions/roles'
import type { McpServer } from '@/types/mcp'

interface IdentityFacets {
  tone_adjustment?: string
  priority_override?: string[]
  special_behaviors?: string[]
}

interface FullSkill {
  id: string
  name: string
  description: string
  prompt_template?: string
  short_description?: string
  detailed_instructions?: string
  allowed_tools?: string[]
}

interface IdentityCoreContext {
  voice?: string | null
  priorities?: Record<string, string> | null
  boundaries?: Record<string, boolean | string[]> | null
}

interface RoleSettingsFormProps {
  role: {
    id: string
    name: string
    description: string | null
    instructions: string
    identity_facets: IdentityFacets | null
    approval_policy: string
    model_preference: string | null
  }
  roleSkills: Array<{
    skill_id: string
    config_overrides?: Record<string, unknown> | null
    skills: FullSkill | null
  }>
  allSkills: Array<FullSkill>
  mcpServers: McpServer[]
  identityCore?: IdentityCoreContext | null
}

export function RoleSettingsForm({ role, roleSkills, allSkills, mcpServers, identityCore }: RoleSettingsFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description || '',
    instructions: role.instructions,
    identity_facets: role.identity_facets || {
      tone_adjustment: '',
      priority_override: [],
      special_behaviors: [],
    },
    approval_policy: role.approval_policy,
    model_preference: role.model_preference || 'anthropic/claude-sonnet-4-5-20250929',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
          identity_facets: formData.identity_facets,
          approval_policy: formData.approval_policy,
          model_preference: formData.model_preference,
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

  const handleDelete = async () => {
    if (!confirm(`Delete "${formData.name}"? This will permanently delete all conversations and cannot be undone.`)) {
      return
    }

    setDeleting(true)
    const result = await deleteRole(role.id)

    if (result.success) {
      router.push('/roles')
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete role' })
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
    <Tabs defaultValue="general" className="space-y-6" id={`role-settings-${role.id}`}>
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
        <TabsList className="inline-flex w-max gap-1 md:grid md:w-full md:grid-cols-4">
          <TabsTrigger value="general" className="min-w-fit px-4">General</TabsTrigger>
          <TabsTrigger value="personality" className="min-w-fit px-4">Personality</TabsTrigger>
          <TabsTrigger value="skills" className="min-w-fit px-4">Skills</TabsTrigger>
          <TabsTrigger value="mcp" className="min-w-fit px-4">MCP Servers</TabsTrigger>
        </TabsList>
      </div>

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
                <ModelSelector
                  value={formData.model_preference}
                  onChange={(value) => setFormData({ ...formData, model_preference: value })}
                />
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

      <TabsContent value="personality">
        <Card>
          <CardHeader>
            <CardTitle>Personality</CardTitle>
            <CardDescription>
              Define how this role&apos;s personality differs from your identity core.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Identity Core Context */}
            {identityCore?.voice && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Your Identity Core
                </h4>
                <p className="text-sm text-muted-foreground italic">
                  &quot;{identityCore.voice}&quot;
                </p>
                {identityCore.priorities && Object.keys(identityCore.priorities).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(identityCore.priorities).map(([key, level]) => (
                      <span
                        key={key}
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {key}: {level}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <IdentityFacetsEditor
              facets={formData.identity_facets}
              onChange={(facets) => setFormData({ ...formData, identity_facets: facets })}
            />

            {message && (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}

            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Personality'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="skills">
        <SkillsManager
          roleId={role.id}
          roleSkills={roleSkills}
          allSkills={allSkills}
          onUpdate={() => router.refresh()}
        />
      </TabsContent>

      <TabsContent value="mcp">
        <RoleMcpManager
          roleId={role.id}
          mcpServers={mcpServers}
          onUpdate={() => router.refresh()}
        />
      </TabsContent>
    </Tabs>

    {/* Danger Zone */}
    <Card className="border-red-200 dark:border-red-900">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible actions for this role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Delete this role</p>
            <p className="text-sm text-muted-foreground">
              All conversations and MCP server configs will be permanently deleted.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full sm:w-auto"
          >
            {deleting ? 'Deleting...' : 'Delete Role'}
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
