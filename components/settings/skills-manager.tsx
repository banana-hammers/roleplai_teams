'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Pencil, Trash2, X, Check, Zap, Wrench, Search, Sparkles } from 'lucide-react'
import { SkillFormFields } from '@/components/settings/skill-form-fields'
import {
  createSkill,
  updateSkill,
  deleteSkill,
  linkSkillToRole,
  unlinkSkillFromRole,
} from '@/app/actions/roles'
import { SkillForgeModal } from '@/components/skills/skill-forge-modal'
import type {
  SkillInterviewMode,
  ExistingSkillContext,
  ForgeExtractedSkill,
} from '@/types/skill-creation'

interface Skill {
  id: string
  name: string
  description: string
  prompt_template?: string
  short_description?: string
  detailed_instructions?: string
  allowed_tools?: string[]
  model_preference?: string | null
}

interface FullSkill {
  id: string
  name: string
  description: string
  prompt_template?: string
  short_description?: string
  detailed_instructions?: string
  allowed_tools?: string[]
  model_preference?: string | null
}

interface SkillsManagerProps {
  roleId: string
  roleSkills: Array<{
    skill_id: string
    skills: FullSkill | null
  }>
  allSkills: Array<FullSkill>
  onUpdate?: () => void
}

export function SkillsManager({ roleId, roleSkills, allSkills, onUpdate }: SkillsManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state for creating new skill
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    prompt_template: '',
    short_description: '',
    detailed_instructions: '',
    allowed_tools: [] as string[],
    model_preference: '' as string,
  })

  // Forge modal state
  const [forgeModalOpen, setForgeModalOpen] = useState(false)
  const [forgeMode, setForgeMode] = useState<SkillInterviewMode>('create')
  const [forgeExistingSkill, setForgeExistingSkill] = useState<ExistingSkillContext | undefined>()

  // Get linked skill IDs for filtering
  const linkedSkillIds = new Set(roleSkills.map(rs => rs.skill_id))

  // Combine all skills into a unified list with status
  const unifiedSkills = [
    // Active skills (linked to this role)
    ...roleSkills
      .filter(rs => rs.skills)
      .map(rs => ({
        ...rs.skills!,
        isActive: true,
        skill_id: rs.skill_id,
      })),
    // Available skills (not linked)
    ...allSkills
      .filter(skill => !linkedSkillIds.has(skill.id))
      .map(skill => ({
        ...skill,
        isActive: false,
        skill_id: skill.id,
      })),
  ]

  // Filter by search query
  const filteredSkills = unifiedSkills.filter(skill => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query)
    )
  })

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
        model_preference: newSkill.model_preference || null,
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
          model_preference: '',
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
        model_preference: editingSkill.model_preference || null,
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

  const toggleToolInValues = (toolId: string, current: string[]): string[] => {
    return current.includes(toolId)
      ? current.filter(t => t !== toolId)
      : [...current, toolId]
  }

  const handleDeleteSkill = async (skillId: string) => {
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

  // Handle Forge modal completion - pre-fill form with extracted skill
  const handleForgeComplete = (extractedSkill: ForgeExtractedSkill) => {
    if (forgeMode === 'edit' && forgeExistingSkill) {
      // Edit mode: update the editing skill state (preserve existing model_preference)
      setEditingSkill({
        id: forgeExistingSkill.id,
        name: extractedSkill.name,
        description: extractedSkill.description,
        prompt_template: extractedSkill.prompt_template,
        short_description: extractedSkill.short_description || '',
        detailed_instructions: extractedSkill.detailed_instructions || '',
        allowed_tools: extractedSkill.allowed_tools || [],
        model_preference: forgeExistingSkill.model_preference,
      })
      setMessage({ type: 'success', text: 'Skill updated by Forge. Review and save your changes.' })
    } else {
      // Create mode: pre-fill the new skill form
      setNewSkill({
        name: extractedSkill.name,
        description: extractedSkill.description,
        prompt_template: extractedSkill.prompt_template,
        short_description: extractedSkill.short_description || '',
        detailed_instructions: extractedSkill.detailed_instructions || '',
        allowed_tools: extractedSkill.allowed_tools || [],
        model_preference: '',
      })
      setShowCreateForm(true)
      setMessage({ type: 'success', text: 'Skill generated by Forge. Review and create it.' })
    }

    // Reset Forge state
    setForgeExistingSkill(undefined)
  }

  // Open Forge modal for creating a new skill
  const openForgeCreate = () => {
    setForgeMode('create')
    setForgeExistingSkill(undefined)
    setForgeModalOpen(true)
  }

  // Open Forge modal for editing an existing skill
  const openForgeEdit = (skill: Skill) => {
    setForgeMode('edit')
    setForgeExistingSkill({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      prompt_template: skill.prompt_template || '',
      short_description: skill.short_description,
      detailed_instructions: skill.detailed_instructions,
      allowed_tools: skill.allowed_tools,
      model_preference: skill.model_preference,
    })
    setForgeModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      <StatusMessage message={message} />

      {/* Search and Create Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={openForgeCreate}
            disabled={showCreateForm || forgeModalOpen}
            className="flex-1 sm:flex-none"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Ask Forge
          </Button>
          <Button onClick={() => setShowCreateForm(true)} disabled={showCreateForm} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            New Skill
          </Button>
        </div>
      </div>

      {/* Create New Skill Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Skill</CardTitle>
            <CardDescription>
              Define a new skill for this role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SkillFormFields
                values={newSkill}
                onChange={(values) => setNewSkill({ ...values, model_preference: values.model_preference ?? '' })}
                idPrefix="skill"
                onToggleTool={(toolId) => setNewSkill({ ...newSkill, allowed_tools: toggleToolInValues(toolId, newSkill.allowed_tools) })}
              />

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
                    model_preference: '',
                  })
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Skills
          </CardTitle>
          <CardDescription>
            Manage skills for this role. Active skills are used during conversations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSkills.length > 0 ? (
            <div className="space-y-2">
              {filteredSkills.map((skill) => (
                <div key={skill.skill_id}>
                  {editingSkill?.id === skill.id ? (
                    // Edit mode - expanded card
                    <Card className="border-primary">
                      <CardContent className="pt-4 space-y-4">
                        <SkillFormFields
                          values={{
                            name: editingSkill.name,
                            description: editingSkill.description,
                            prompt_template: editingSkill.prompt_template || '',
                            short_description: editingSkill.short_description || '',
                            detailed_instructions: editingSkill.detailed_instructions || '',
                            allowed_tools: editingSkill.allowed_tools || [],
                            model_preference: editingSkill.model_preference ?? null,
                          }}
                          onChange={(values) => setEditingSkill({ ...editingSkill, ...values })}
                          idPrefix="edit-skill"
                          onToggleTool={(toolId) => setEditingSkill({
                            ...editingSkill,
                            allowed_tools: toggleToolInValues(toolId, editingSkill.allowed_tools || []),
                          })}
                        />

                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleUpdateSkill} disabled={isPending}>
                            <Check className="mr-1 h-4 w-4" />
                            {isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingSkill(null)}>
                            <X className="mr-1 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // View mode
                    <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{skill.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 sm:truncate">
                          {skill.description}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:ml-4 sm:flex-nowrap">
                        {skill.isActive ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="outline">Available</Badge>
                        )}
                        {(skill.allowed_tools?.length ?? 0) > 0 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            <Wrench className="mr-1 h-3 w-3" />
                            Agentic
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 ml-auto sm:ml-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openForgeEdit({
                              id: skill.id,
                              name: skill.name,
                              description: skill.description,
                              prompt_template: skill.prompt_template,
                              short_description: skill.short_description || '',
                              detailed_instructions: skill.detailed_instructions || '',
                              allowed_tools: skill.allowed_tools || [],
                              model_preference: skill.model_preference,
                            })}
                            title="Edit with Forge"
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSkill({
                              id: skill.id,
                              name: skill.name,
                              description: skill.description,
                              prompt_template: skill.prompt_template,
                              short_description: skill.short_description || '',
                              detailed_instructions: skill.detailed_instructions || '',
                              allowed_tools: skill.allowed_tools || [],
                              model_preference: skill.model_preference,
                            })}
                            title="Edit manually"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {skill.isActive ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUnlinkSkill(skill.skill_id)}
                              disabled={isPending}
                              title="Remove from role"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleLinkSkill(skill.id)}
                              disabled={isPending}
                              title="Add to role"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isPending}
                                title="Delete skill"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete &ldquo;{skill.name}&rdquo;?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this skill and unlink it from all roles. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSkill(skill.id)} className="bg-destructive text-white hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <p className="text-sm text-muted-foreground">
              No skills matching &quot;{searchQuery}&quot;
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No skills yet. Create your first skill above.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Forge Modal for NLM skill creation/editing */}
      <SkillForgeModal
        open={forgeModalOpen}
        onOpenChange={setForgeModalOpen}
        mode={forgeMode}
        roleId={roleId}
        existingSkill={forgeExistingSkill}
        onComplete={handleForgeComplete}
      />
    </div>
  )
}
