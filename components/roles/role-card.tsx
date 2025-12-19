'use client'

import { cn } from '@/lib/utils'
import { PersonalityTraits } from './personality-traits'
import { SkillSlots } from './skill-slots'
import type { Role } from '@/types/role'

interface RoleCardProps {
  role: Role
  isSelected?: boolean
  onSelect?: () => void
  className?: string
}

function getApprovalLabel(policy: string): string {
  switch (policy) {
    case 'always':
      return 'High Trust'
    case 'never':
      return 'Autonomous'
    case 'smart':
      return 'Adaptive'
    default:
      return policy
  }
}

function getModelLabel(preference: string | null): string | null {
  if (!preference) return null
  const parts = preference.split('/')
  const model = parts[1] || parts[0]
  if (model.length > 16) {
    return model.slice(0, 16) + '...'
  }
  return model
}

export function RoleCard({ role, isSelected, onSelect, className }: RoleCardProps) {
  const modelLabel = getModelLabel(role.model_preference)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        // Base structure
        'group relative overflow-hidden',
        'w-full max-w-[320px]',
        'rounded-xl border',
        'text-left',

        // Background
        'bg-card',

        // Border
        'border-border/50',

        // Hover state (transitions only)
        'transition-all duration-300 ease-out',
        'hover:border-primary/50',
        'hover:shadow-lg hover:shadow-primary/5',
        'hover:-translate-y-0.5',

        // Focus state
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2',

        // Selection state
        isSelected && [
          'border-primary',
          'ring-2 ring-primary/30',
          'shadow-lg shadow-primary/20',
        ],

        className
      )}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h3 className="font-display text-lg font-bold leading-tight">
          {role.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {role.description || 'No description'}
        </p>
      </div>

      {/* Traits Section */}
      <div className="px-4 pb-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Traits
        </h4>
        <PersonalityTraits facets={role.identity_facets || {}} maxVisible={3} />
      </div>

      {/* Tools Section */}
      <div className="px-4 pb-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Tools
        </h4>
        <SkillSlots tools={role.allowed_tools || []} maxVisible={3} />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-border/50 flex items-center justify-between">
        <span
          className={cn(
            'inline-flex items-center',
            'px-2 py-0.5 rounded-full',
            'text-[10px] font-medium uppercase tracking-wide',
            'bg-muted text-muted-foreground',
            'border border-border'
          )}
        >
          {getApprovalLabel(role.approval_policy)}
        </span>
        {modelLabel && (
          <span className="font-mono text-[10px] text-muted-foreground">
            {modelLabel}
          </span>
        )}
      </div>
    </button>
  )
}
