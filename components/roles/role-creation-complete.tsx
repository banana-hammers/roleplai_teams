'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ExtractedRoleConfig, ExtractedSkill } from '@/types/role-creation'

interface RoleCreationCompleteProps {
  role: ExtractedRoleConfig
  skills: ExtractedSkill[]
  roleId: string
  onCreateAnother: () => void
}

export function RoleCreationComplete({
  role,
  skills,
  roleId,
  onCreateAnother,
}: RoleCreationCompleteProps) {
  const router = useRouter()

  const handleStartChatting = () => {
    router.push(`/roles/${roleId}`)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          <h2 className="text-3xl font-bold tracking-tight">
            {role.name} is Ready!
          </h2>
        </div>
        <p className="text-lg text-muted-foreground">
          Your new role has been created.
        </p>
      </div>

      {/* Role summary */}
      <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">{role.name}</h3>
          <p className="text-sm text-muted-foreground">{role.description}</p>
        </div>

        {skills.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              {skills.length} Starter Skill{skills.length !== 1 ? 's' : ''}
            </h4>
            <ul className="space-y-1">
              {skills.map((skill, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-primary">•</span>
                  <span>{skill.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          Your identity core powers this role, so it will communicate in your voice
          and respect your boundaries.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Button onClick={handleStartChatting} size="lg" className="w-full">
          Start Chatting with {role.name}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Button
          onClick={onCreateAnother}
          variant="outline"
          size="lg"
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Another Role
        </Button>
      </div>
    </div>
  )
}
