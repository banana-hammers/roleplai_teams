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
import { IdentityFacetsEditor } from './identity-facets-editor'
import { ModelSelector } from './model-selector'
import { SkillsManager } from './skills-manager'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface IdentityFacets {
  tone_adjustment?: string
  priority_override?: string[]
  special_behaviors?: string[]
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

export function RoleSettingsForm({ role, roleSkills, allSkills }: RoleSettingsFormProps) {
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

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="personality">Personality</TabsTrigger>
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
          <CardContent className="space-y-4">
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
    </Tabs>
  )
}
