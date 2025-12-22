'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, X, Check, Zap, Wrench } from 'lucide-react'
import {
  createSkill,
  updateSkill,
  deleteSkill,
  linkSkillToRole,
  unlinkSkillFromRole,
} from '@/app/actions/roles'

// Available built-in tools that skills can use
const AVAILABLE_TOOLS = [
  { id: 'web_search', name: 'Web Search', description: 'Search the web for information' },
  { id: 'web_fetch', name: 'Web Fetch', description: 'Fetch and parse web page content' },
]

interface Skill {
  id: string
  name: string
  description: string
  prompt_template?: string
  short_description?: string
  detailed_instructions?: string
  allowed_tools?: string[]
}

interface SkillsManagerProps {
  roleId: string
  roleSkills: Array<{
    skill_id: string
    skills: { id: string; name: string; description: string } | null
  }>
  allSkills: Array<{
    id: string
    name: string
    description: string
    role_id?: string | null
  }>
  onUpdate?: () => void
}

export function SkillsManager({ roleId, roleSkills, allSkills, onUpdate }: SkillsManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state for creating new skill
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    prompt_template: '',
    short_description: '',
    detailed_instructions: '',
    allowed_tools: [] as string[],
  })

  // Get linked skill IDs for filtering
  const linkedSkillIds = new Set(roleSkills.map(rs => rs.skill_id))

  // Available skills (not yet linked to this role)
  const availableSkills = allSkills.filter(skill => !linkedSkillIds.has(skill.id))

  const handleCreateSkill = async () => {
    if (!newSkill.name.trim() || !newSkill.description.trim() || !newSkill.prompt_template.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    startTransition(async () => {
      const result = await createSkill(roleId, {
        name: newSkill.name.trim(),
        description: newSkill.description.trim(),
        prompt_template: newSkill.prompt_template.trim(),
        short_description: newSkill.short_description.trim() || null,
        detailed_instructions: newSkill.detailed_instructions.trim() || null,
        allowed_tools: newSkill.allowed_tools,
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'Skill created successfully' })
        setNewSkill({
          name: '',
          description: '',
          prompt_template: '',
          short_description: '',
          detailed_instructions: '',
          allowed_tools: [],
        })
        setShowCreateForm(false)
        onUpdate?.()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create skill' })
      }
    })
  }

  const handleUpdateSkill = async () => {
    if (!editingSkill) return

    startTransition(async () => {
      const result = await updateSkill(editingSkill.id, {
        name: editingSkill.name,
        description: editingSkill.description,
        prompt_template: editingSkill.prompt_template,
        short_description: editingSkill.short_description || null,
        detailed_instructions: editingSkill.detailed_instructions || null,
        allowed_tools: editingSkill.allowed_tools || [],
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'Skill updated successfully' })
        setEditingSkill(null)
        onUpdate?.()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update skill' })
      }
    })
  }

  const toggleTool = (toolId: string, isNewSkill: boolean) => {
    if (isNewSkill) {
      const current = newSkill.allowed_tools
      if (current.includes(toolId)) {
        setNewSkill({ ...newSkill, allowed_tools: current.filter(t => t !== toolId) })
      } else {
        setNewSkill({ ...newSkill, allowed_tools: [...current, toolId] })
      }
    } else if (editingSkill) {
      const current = editingSkill.allowed_tools || []
      if (current.includes(toolId)) {
        setEditingSkill({ ...editingSkill, allowed_tools: current.filter(t => t !== toolId) })
      } else {
        setEditingSkill({ ...editingSkill, allowed_tools: [...current, toolId] })
      }
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
      return
    }

    startTransition(async () => {
      const result = await deleteSkill(skillId)

      if (result.success) {
        setMessage({ type: 'success', text: 'Skill deleted successfully' })
        onUpdate?.()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete skill' })
      }
    })
  }

  const handleLinkSkill = async (skillId: string) => {
    startTransition(async () => {
      const result = await linkSkillToRole(roleId, skillId)

      if (result.success) {
        setMessage({ type: 'success', text: 'Skill linked successfully' })
        onUpdate?.()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to link skill' })
      }
    })
  }

  const handleUnlinkSkill = async (skillId: string) => {
    startTransition(async () => {
      const result = await unlinkSkillFromRole(roleId, skillId)

      if (result.success) {
        setMessage({ type: 'success', text: 'Skill unlinked successfully' })
        onUpdate?.()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to unlink skill' })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`rounded-lg p-3 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Active Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Active Skills
          </CardTitle>
          <CardDescription>
            Skills this role can use during conversations.
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
                  {editingSkill?.id === rs.skill_id ? (
                    // Edit mode
                    <div className="flex-1 space-y-3">
                      <Input
                        value={editingSkill.name}
                        onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                        placeholder="Skill name"
                      />
                      <Input
                        value={editingSkill.description}
                        onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                        placeholder="Skill description"
                      />
                      <Textarea
                        value={editingSkill.prompt_template || ''}
                        onChange={(e) => setEditingSkill({ ...editingSkill, prompt_template: e.target.value })}
                        placeholder="Prompt template"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdateSkill} disabled={isPending}>
                          <Check className="mr-1 h-4 w-4" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingSkill(null)}>
                          <X className="mr-1 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div>
                        <p className="font-medium">{rs.skills?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {rs.skills?.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Active</Badge>
                        {(rs.skills as any)?.allowed_tools?.length > 0 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            <Wrench className="mr-1 h-3 w-3" />
                            Agentic
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSkill({
                            id: rs.skill_id,
                            name: rs.skills?.name || '',
                            description: rs.skills?.description || '',
                            short_description: (rs.skills as any)?.short_description || '',
                            detailed_instructions: (rs.skills as any)?.detailed_instructions || '',
                            allowed_tools: (rs.skills as any)?.allowed_tools || [],
                          })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnlinkSkill(rs.skill_id)}
                          disabled={isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSkill(rs.skill_id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No skills assigned to this role. Create a new skill or add an existing one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Skills to Add */}
      {availableSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Skills</CardTitle>
            <CardDescription>
              Your other skills that can be added to this role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-sm text-muted-foreground">{skill.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkSkill(skill.id)}
                    disabled={isPending}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Skill */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Skill</CardTitle>
          <CardDescription>
            Define a new skill for this role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showCreateForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skill-name">Name *</Label>
                <Input
                  id="skill-name"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  placeholder="e.g., Draft Email, Review Code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill-short-desc">Short Description (for system prompt)</Label>
                <Input
                  id="skill-short-desc"
                  value={newSkill.short_description}
                  onChange={(e) => setNewSkill({ ...newSkill, short_description: e.target.value })}
                  placeholder="~50 chars: Concise description shown to the AI"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Brief description that appears in the system prompt. Keep it short.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill-description">Full Description *</Label>
                <Input
                  id="skill-description"
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  placeholder="Complete description of what this skill does"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill-prompt">Prompt Template *</Label>
                <Textarea
                  id="skill-prompt"
                  value={newSkill.prompt_template}
                  onChange={(e) => setNewSkill({ ...newSkill, prompt_template: e.target.value })}
                  placeholder="The task template. Use {{placeholder}} for inputs."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skill-instructions">Detailed Instructions</Label>
                <Textarea
                  id="skill-instructions"
                  value={newSkill.detailed_instructions}
                  onChange={(e) => setNewSkill({ ...newSkill, detailed_instructions: e.target.value })}
                  placeholder="Detailed guidance loaded when this skill is invoked..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Rich instructions loaded only when the skill is used (not in system prompt).
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Allowed Tools
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Enable tools this skill can use. Skills with tools run in agentic mode.
                </p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <Badge
                      key={tool.id}
                      variant={newSkill.allowed_tools.includes(tool.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTool(tool.id, true)}
                    >
                      {newSkill.allowed_tools.includes(tool.id) && <Check className="mr-1 h-3 w-3" />}
                      {tool.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateSkill} disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Skill'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowCreateForm(false)
                  setNewSkill({
                    name: '',
                    description: '',
                    prompt_template: '',
                    short_description: '',
                    detailed_instructions: '',
                    allowed_tools: [],
                  })
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Skill
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
