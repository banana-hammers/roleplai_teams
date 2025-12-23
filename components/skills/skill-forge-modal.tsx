'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { SkillForgeInterview } from './skill-forge-interview'
import type {
  SkillInterviewMode,
  ExistingSkillContext,
  ForgeExtractedSkill,
} from '@/types/skill-creation'

interface SkillForgeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: SkillInterviewMode
  roleId: string
  existingSkill?: ExistingSkillContext
  onComplete: (skill: ForgeExtractedSkill) => void
}

export function SkillForgeModal({
  open,
  onOpenChange,
  mode,
  roleId,
  existingSkill,
  onComplete,
}: SkillForgeModalProps) {
  const handleComplete = (skill: ForgeExtractedSkill) => {
    onComplete(skill)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const dialogTitle = mode === 'edit' ? 'Edit Skill with Forge' : 'Create Skill with Forge'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl h-[80vh] max-h-[600px] flex flex-col p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <div className="flex-1 overflow-hidden p-6">
          {open && (
            <SkillForgeInterview
              mode={mode}
              roleId={roleId}
              existingSkill={existingSkill}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
