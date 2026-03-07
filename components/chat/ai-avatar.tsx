'use client'

import { cn } from '@/lib/utils'

export interface AIAvatarProps {
  state?: 'idle' | 'typing' | 'speaking'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
}

const ringSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
}

export function AIAvatar({ state = 'idle', size = 'md', className }: AIAvatarProps) {
  const isActive = state === 'typing' || state === 'speaking'

  return (
    <div className={cn('relative flex-shrink-0', className)}>
      {/* Expanding rings - only visible when active */}
      {isActive && (
        <>
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-primary/20',
              ringSizes[size],
              'animate-[ring-expand_1.5s_ease-out_infinite]'
            )}
          />
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-primary/15',
              ringSizes[size],
              'animate-[ring-expand_1.5s_ease-out_infinite_0.5s]'
            )}
          />
        </>
      )}

      {/* Core orb */}
      <div
        className={cn(
          'relative rounded-full',
          'bg-linear-to-br from-primary via-primary/80 to-indigo-400',
          sizeClasses[size],
          isActive
            ? 'animate-[pulse-glow_2s_ease-in-out_infinite]'
            : 'animate-[orb-breathe_3s_ease-in-out_infinite]',
          // Glow effect
          'shadow-[0_0_8px_var(--primary),0_0_16px_var(--primary)]'
        )}
      >
        {/* Inner highlight */}
        <div
          className={cn(
            'absolute top-1 left-1 rounded-full bg-white/30',
            size === 'sm' && 'h-1.5 w-1.5',
            size === 'md' && 'h-2 w-2',
            size === 'lg' && 'h-2.5 w-2.5'
          )}
        />
      </div>
    </div>
  )
}
