'use client'

import { cn } from '@/lib/utils'
import { AIAvatar } from './ai-avatar'

export interface TypingIndicatorProps {
  senderName?: string
  className?: string
}

export function TypingIndicator({ senderName = 'Assistant', className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex gap-3 justify-start',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      {/* Animated avatar in typing state */}
      <AIAvatar state="typing" size="sm" className="mt-1" />

      <div className="rounded-2xl px-4 py-3 bg-gradient-to-br from-background via-muted/30 to-muted/50 border shadow-md">
        <div className="flex items-center gap-3">
          {/* Wave dots */}
          <div className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-full bg-foreground/50 animate-[typing-wave_1s_ease-in-out_infinite]"
            />
            <div
              className="h-2 w-2 rounded-full bg-foreground/50 animate-[typing-wave_1s_ease-in-out_infinite_0.15s]"
            />
            <div
              className="h-2 w-2 rounded-full bg-foreground/50 animate-[typing-wave_1s_ease-in-out_infinite_0.3s]"
            />
          </div>

          {/* Typing label */}
          <span className="text-xs text-muted-foreground animate-pulse">
            {senderName} is typing...
          </span>
        </div>
      </div>
    </div>
  )
}
