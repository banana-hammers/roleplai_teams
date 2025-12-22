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
        'flex gap-4 py-3',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      {/* Avatar column - matches message bubble */}
      <div className="shrink-0 w-8">
        <AIAvatar state="typing" size="sm" />
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        {/* Sender name */}
        <div className="text-sm font-medium mb-1.5 text-foreground">
          {senderName}
        </div>

        {/* Typing dots */}
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-[typing-wave_1s_ease-in-out_infinite]"
          />
          <div
            className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-[typing-wave_1s_ease-in-out_infinite_0.15s]"
          />
          <div
            className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-[typing-wave_1s_ease-in-out_infinite_0.3s]"
          />
        </div>
      </div>
    </div>
  )
}
