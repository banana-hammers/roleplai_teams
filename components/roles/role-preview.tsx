'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Edit2 } from 'lucide-react'
import type { ExtractedRoleConfig } from '@/types/role-creation'

interface RolePreviewProps {
  role: ExtractedRoleConfig
  onEdit: (updates: Partial<ExtractedRoleConfig>) => void
}

export function RolePreview({ role, onEdit }: RolePreviewProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [editedName, setEditedName] = useState(role.name)
  const [editedDescription, setEditedDescription] = useState(role.description)

  const handleNameSave = () => {
    if (editedName.trim()) {
      onEdit({ name: editedName.trim() })
    } else {
      setEditedName(role.name)
    }
    setIsEditingName(false)
  }

  const handleDescriptionSave = () => {
    if (editedDescription.trim()) {
      onEdit({ description: editedDescription.trim() })
    } else {
      setEditedDescription(role.description)
    }
    setIsEditingDescription(false)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your New Role</h3>

      {/* Name field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Name</label>
        {isEditingName ? (
          <div className="flex gap-2">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave()
                if (e.key === 'Escape') {
                  setEditedName(role.name)
                  setIsEditingName(false)
                }
              }}
            />
            <Button size="sm" onClick={handleNameSave}>Save</Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditedName(role.name)
                setIsEditingName(false)
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 p-3 rounded-md border bg-background cursor-pointer hover:bg-muted/50"
            onClick={() => setIsEditingName(true)}
          >
            <span className="flex-1 font-medium">{role.name}</span>
            <Edit2 className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Description</label>
        {isEditingDescription ? (
          <div className="space-y-2">
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="min-h-[80px]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditedDescription(role.description)
                  setIsEditingDescription(false)
                }
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleDescriptionSave}>Save</Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditedDescription(role.description)
                  setIsEditingDescription(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="flex items-start gap-2 p-3 rounded-md border bg-background cursor-pointer hover:bg-muted/50"
            onClick={() => setIsEditingDescription(true)}
          >
            <span className="flex-1 text-sm">{role.description}</span>
            <Edit2 className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        )}
      </div>

      {/* Instructions (collapsible) */}
      <div className="space-y-2">
        <button
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          {showInstructions ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Instructions
        </button>
        {showInstructions && (
          <div className="p-3 rounded-md border bg-muted/30 text-sm whitespace-pre-wrap">
            {role.instructions}
          </div>
        )}
      </div>

      {/* Identity Adjustments */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Identity Adjustments</label>
        <div className="p-3 rounded-md border bg-muted/30 space-y-2">
          {role.identity_facets.tone_adjustment && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground">Tone:</span>
              <span>{role.identity_facets.tone_adjustment}</span>
            </div>
          )}
          {role.identity_facets.priority_override && role.identity_facets.priority_override.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground">Priorities:</span>
              <div className="flex flex-wrap gap-1">
                {role.identity_facets.priority_override.map((priority) => (
                  <Badge key={priority} variant="secondary" className="text-xs">
                    {priority}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {role.identity_facets.special_behaviors && role.identity_facets.special_behaviors.length > 0 && (
            <div className="space-y-1 text-sm">
              <span className="text-muted-foreground">Behaviors:</span>
              <ul className="ml-4 space-y-1">
                {role.identity_facets.special_behaviors.map((behavior, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{behavior}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
