'use client'

import { cn } from '@/lib/utils'
import type { ModelTierConfig } from '@/lib/utils/model-tiers'

interface TierAvatarProps {
  tier: ModelTierConfig
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showOnlineIndicator?: boolean
  className?: string
}

const sizeConfig = {
  sm: {
    container: 'h-8 w-8',
    icon: 'h-4 w-4',
  },
  md: {
    container: 'h-10 w-10',
    icon: 'h-5 w-5',
  },
  lg: {
    container: 'h-12 w-12',
    icon: 'h-6 w-6',
  },
  xl: {
    container: 'h-16 w-16',
    icon: 'h-8 w-8',
  },
}

export function TierAvatar({
  tier,
  size = 'md',
  showOnlineIndicator = false,
  className
}: TierAvatarProps) {
  const Icon = tier.icon
  const sizes = sizeConfig[size]

  const isAnimated = tier.tier === 'legendary' || tier.tier === 'epic'

  return (
    <div className={cn('relative', className)}>
      {/* Outer glow ring for legendary/epic */}
      {isAnimated && (
        <div
          className={cn(
            'absolute inset-0 rounded-xl',
            'animate-[orb-breathe_3s_ease-in-out_infinite]',
            tier.tier === 'legendary' && 'bg-amber-500/20',
            tier.tier === 'epic' && 'bg-indigo-400/20',
          )}
          style={{
            filter: 'blur(8px)',
          }}
        />
      )}

      {/* Main orb container */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl',
          sizes.container,
          tier.bgClass,
          'border',
          tier.borderClass,
          'transition-all duration-300',
          'group-hover:scale-110',
          // Legendary gets pulse glow
          tier.tier === 'legendary' && 'animate-[pulse-glow_3s_ease-in-out_infinite]',
        )}
      >
        {/* Icon */}
        <Icon className={cn(sizes.icon, tier.colorClass)} />

        {/* Inner highlight for 3D effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-xl',
            'bg-linear-to-br from-white/20 via-transparent to-transparent',
            'pointer-events-none',
          )}
        />
      </div>

      {/* Online indicator */}
      {showOnlineIndicator && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5',
            'h-3 w-3 rounded-full',
            'bg-green-500',
            'ring-2 ring-background',
            'animate-pulse',
          )}
        />
      )}

      {/* Floating particles for legendary */}
      {tier.tier === 'legendary' && (
        <>
          <div
            className={cn(
              'absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full',
              'bg-amber-400',
              'animate-float',
            )}
            style={{ animationDelay: '0s' }}
          />
          <div
            className={cn(
              'absolute -bottom-1 -left-1 h-1 w-1 rounded-full',
              'bg-amber-400',
              'animate-float',
            )}
            style={{ animationDelay: '1s' }}
          />
        </>
      )}
    </div>
  )
}
