'use client'

import { cn } from '@/lib/utils'
import { TierAvatar } from '@/components/roles/tier-avatar'
import { AIAvatar } from './ai-avatar'
import type { ModelTierConfig } from '@/lib/utils/model-tiers'

// Tier-specific dot colors for typing indicator
const tierDotColors: Record<string, string> = {
  legendary: 'bg-amber-500/60',
  epic: 'bg-indigo-400/60',
  rare: 'bg-teal-500/60',
  common: 'bg-slate-400/60',
}

// Tier-specific border colors to match message bubbles
const tierBorderColors: Record<string, string> = {
  legendary: 'border-l-2 border-amber-500/40',
  epic: 'border-l-2 border-indigo-400/40',
  rare: 'border-l-2 border-teal-500/40',
  common: 'border-l-2 border-slate-400/30',
}

export interface TypingIndicatorProps {
  senderName?: string
  tierConfig?: ModelTierConfig
  className?: string
}

export function TypingIndicator({ senderName = 'Assistant', tierConfig, className }: TypingIndicatorProps) {
  const dotColor = tierConfig ? tierDotColors[tierConfig.tier] : 'bg-muted-foreground/60'
  const borderColor = tierConfig ? tierBorderColors[tierConfig.tier] : ''

  return (
    <div
      className={cn(
        'flex gap-4 py-3',
        borderColor,
        tierConfig && 'pl-2',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      {/* Avatar column - matches message bubble */}
      <div className="shrink-0 w-8">
        {tierConfig ? (
          <TierAvatar tier={tierConfig} size="sm" />
        ) : (
          <AIAvatar state="typing" size="sm" />
        )}
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        {/* Sender name */}
        <div className="text-sm font-medium mb-1.5 text-foreground">
          {senderName}
        </div>

        {/* Typing dots - colored by tier */}
        <div className="flex items-center gap-1.5">
          <div
            className={cn('h-2 w-2 rounded-full animate-[typing-wave_1s_ease-in-out_infinite]', dotColor)}
          />
          <div
            className={cn('h-2 w-2 rounded-full animate-[typing-wave_1s_ease-in-out_infinite_0.15s]', dotColor)}
          />
          <div
            className={cn('h-2 w-2 rounded-full animate-[typing-wave_1s_ease-in-out_infinite_0.3s]', dotColor)}
          />
        </div>
      </div>
    </div>
  )
}
