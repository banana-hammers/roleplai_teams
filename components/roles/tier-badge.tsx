'use client'

import { cn } from '@/lib/utils'
import type { ModelTierConfig } from '@/lib/utils/model-tiers'

interface TierBadgeProps {
  tier: ModelTierConfig
  size?: 'sm' | 'md'
}

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const Icon = tier.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-semibold uppercase tracking-wide',
        tier.bgClass,
        tier.borderClass,
        tier.colorClass,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span>{tier.label}</span>
    </div>
  )
}
