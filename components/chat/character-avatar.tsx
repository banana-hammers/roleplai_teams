'use client'

import { cn } from '@/lib/utils'
import { Sparkle, Hammer, ScrollText } from 'lucide-react'

export type CharacterName = 'Nova' | 'Forge' | 'Loremaster'

export interface CharacterAvatarProps {
  character: CharacterName
  state?: 'idle' | 'typing'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const characters: Record<CharacterName, {
  icon: typeof Sparkle
  gradient: string
  glowColor: string
  ringColor: string
  idleAnimation: string
  typingAnimation: string
  iconAnimation: string
}> = {
  Nova: {
    icon: Sparkle,
    gradient: 'from-cyan-400 via-blue-500 to-violet-400',
    glowColor: 'shadow-[0_0_8px_oklch(0.65_0.2_220),0_0_16px_oklch(0.65_0.2_220)]',
    ringColor: 'bg-cyan-400/20',
    idleAnimation: 'animate-[nova-pulse_3s_ease-in-out_infinite]',
    typingAnimation: 'animate-[pulse-glow-nova_1.5s_ease-in-out_infinite]',
    iconAnimation: 'animate-[nova-sparkle_2s_ease-in-out_infinite]',
  },
  Forge: {
    icon: Hammer,
    gradient: 'from-orange-400 via-red-500 to-amber-500',
    glowColor: 'shadow-[0_0_8px_oklch(0.7_0.18_55),0_0_16px_oklch(0.7_0.18_55)]',
    ringColor: 'bg-orange-400/20',
    idleAnimation: 'animate-[orb-breathe_3s_ease-in-out_infinite]',
    typingAnimation: 'animate-[forge-hammer_0.6s_ease-in-out_infinite]',
    iconAnimation: '',
  },
  Loremaster: {
    icon: ScrollText,
    gradient: 'from-emerald-400 via-teal-500 to-green-600',
    glowColor: 'shadow-[0_0_8px_oklch(0.65_0.18_160),0_0_16px_oklch(0.65_0.18_160)]',
    ringColor: 'bg-emerald-400/20',
    idleAnimation: 'animate-[orb-breathe_3s_ease-in-out_infinite]',
    typingAnimation: 'animate-[loremaster-scribble_0.8s_ease-in-out_infinite]',
    iconAnimation: 'animate-[loremaster-flip_3s_ease-in-out_infinite]',
  },
}

const sizeConfig = {
  sm: { container: 'h-8 w-8', icon: 'h-3.5 w-3.5', ember: 'h-1 w-1', ring: 'h-8 w-8' },
  md: { container: 'h-10 w-10', icon: 'h-4.5 w-4.5', ember: 'h-1.5 w-1.5', ring: 'h-10 w-10' },
  lg: { container: 'h-12 w-12', icon: 'h-5 w-5', ember: 'h-1.5 w-1.5', ring: 'h-12 w-12' },
}

export function CharacterAvatar({
  character,
  state = 'idle',
  size = 'md',
  className,
}: CharacterAvatarProps) {
  const config = characters[character]
  const sizes = sizeConfig[size]
  const Icon = config.icon
  const isTyping = state === 'typing'

  return (
    <div className={cn('relative flex-shrink-0', className)}>
      {/* Expanding rings when typing */}
      {isTyping && (
        <>
          <div
            className={cn(
              'absolute inset-0 rounded-xl',
              config.ringColor,
              sizes.ring,
              'animate-[ring-expand_1.5s_ease-out_infinite]'
            )}
          />
          <div
            className={cn(
              'absolute inset-0 rounded-xl',
              config.ringColor,
              sizes.ring,
              'animate-[ring-expand_1.5s_ease-out_infinite_0.5s]'
            )}
          />
        </>
      )}

      {/* Main container */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl',
          sizes.container,
          `bg-gradient-to-br ${config.gradient}`,
          isTyping ? config.typingAnimation : config.idleAnimation,
          config.glowColor,
          'border border-white/10',
        )}
      >
        {/* Icon — Nova's sparkle pulses, Forge's hammer is static */}
        <Icon
          className={cn(
            sizes.icon,
            'text-white drop-shadow-sm',
            character === 'Nova' && config.iconAnimation,
          )}
        />

        {/* Frosted glass highlight */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Forge ember particles (always visible, float upward) */}
      {character === 'Forge' && (
        <>
          <div
            className={cn(
              'absolute -top-1 right-0 rounded-full bg-amber-400',
              sizes.ember,
              'animate-[ember-rise_2s_ease-out_infinite]',
            )}
          />
          <div
            className={cn(
              'absolute -top-0.5 left-0.5 rounded-full bg-orange-300',
              sizes.ember,
              'animate-[ember-rise_2s_ease-out_infinite_0.7s]',
            )}
          />
          <div
            className={cn(
              'absolute top-0 right-1.5 rounded-full bg-red-400',
              sizes.ember,
              'animate-[ember-rise_2.5s_ease-out_infinite_1.3s]',
            )}
          />
        </>
      )}
    </div>
  )
}

/** Check if a sender name corresponds to a known character */
export function isCharacterName(name: string | undefined): name is CharacterName {
  return name === 'Nova' || name === 'Forge' || name === 'Loremaster'
}
