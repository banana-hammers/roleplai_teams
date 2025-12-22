'use client'

import { cn } from '@/lib/utils'
import { TierAvatar } from './tier-avatar'
import { SkillPills } from './skill-list'
import { getModelTier, getModelDisplayName } from '@/lib/utils/model-tiers'
import type { RoleWithSkills } from '@/types/role'

interface RoleCardProps {
  role: RoleWithSkills
  isSelected?: boolean
  onSelect?: () => void
  className?: string
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
        'w-full',
        'rounded-2xl border',
        'text-left',

        // Background with subtle gradient
        'bg-card/80 backdrop-blur-sm',

        // Border based on tier
        tierConfig.borderClass,

        // Hover state with lift and glow
        'transition-all duration-300 ease-out',
        'hover:scale-[1.02] hover:shadow-xl',
        tierConfig.tier !== 'common' && 'hover:shadow-current/10',

        // Press feedback for mobile
        'active:scale-[0.98]',

        // Focus state
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2',

        // Selection state with tier glow
        isSelected && [
          'ring-2 ring-offset-2',
          tierConfig.glowClass,
          'animate-bounce-in',
        ],

        className
      )}
    >
      {/* Ambient glow effect based on tier */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        'pointer-events-none',
        tierConfig.tier === 'legendary' && 'bg-linear-to-br from-amber-500/10 via-transparent to-transparent',
        tierConfig.tier === 'epic' && 'bg-linear-to-br from-violet-500/10 via-transparent to-transparent',
        tierConfig.tier === 'rare' && 'bg-linear-to-br from-blue-500/10 via-transparent to-transparent',
      )} />

      {/* Header: Avatar + Name + Model */}
      <div className="relative flex items-center gap-3 p-4 pb-3">
        <TierAvatar tier={tierConfig} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight truncate">
            {role.name}
          </h3>
          {modelLabel && (
            <span className={cn(
              'text-xs font-medium',
              tierConfig.colorClass
            )}>
              {modelLabel}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {role.description || 'Ready to assist you'}
        </p>
      </div>

      {/* Skills as horizontal pills */}
      <div className="px-4 pb-4">
        <SkillPills
          skills={role.resolved_skills || []}
          maxVisible={3}
          showEmptyAction={false}
        />
      </div>
    </button>
  )
}
