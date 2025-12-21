'use client'

import { cn } from '@/lib/utils'
import { PersonalityTraits } from './personality-traits'
import { TierBadge } from './tier-badge'
import { SkillList } from './skill-list'
import { getModelTier, getModelDisplayName } from '@/lib/utils/model-tiers'
import type { RoleWithSkills } from '@/types/role'

interface RoleCardProps {
  role: RoleWithSkills
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

export function RoleCard({ role, isSelected, onSelect, className }: RoleCardProps) {
  const tierConfig = getModelTier(role.model_preference)
  const modelLabel = getModelDisplayName(role.model_preference)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        // Base structure
        'group relative overflow-hidden',
        'w-full max-w-[360px]',
        'rounded-xl border-2',
        'text-left',

        // Background with subtle gradient
        'bg-linear-to-b from-card to-card/95',

        // Border based on tier
        tierConfig.borderClass,

        // Hover state
        'transition-all duration-300 ease-out',
        'hover:shadow-xl hover:-translate-y-1',
        tierConfig.tier !== 'common' && 'hover:shadow-current/10',

        // Focus state
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2',

        // Selection state with tier glow
        isSelected && [
          'ring-2 ring-offset-2',
          tierConfig.glowClass,
        ],

        className
      )}
    >
      {/* Header: Tier Badge + Model */}
      <div className="px-4 pt-3 pb-2 border-b border-border/50 flex items-center justify-between">
        <TierBadge tier={tierConfig} />
        {modelLabel && (
          <span className={cn('font-mono text-[10px] font-medium', tierConfig.colorClass)}>
            {modelLabel}
          </span>
        )}
      </div>

      {/* Name & Description */}
      <div className="px-4 pt-3 pb-3">
        <h3 className="font-display text-lg font-bold leading-tight">
          {role.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {role.description || 'No description'}
        </p>
      </div>

      {/* Skills Section */}
      <div className="px-4 pb-3 border-t border-border/50 pt-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Skills
        </h4>
        <SkillList
          skills={role.resolved_skills || []}
          maxVisible={3}
        />
      </div>

      {/* Traits Section */}
      <div className="px-4 pb-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Traits
        </h4>
        <PersonalityTraits facets={role.identity_facets || {}} maxVisible={3} />
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 pt-2 border-t border-border/50">
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
      </div>
    </button>
  )
}
