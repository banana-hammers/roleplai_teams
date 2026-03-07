'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import type { RateLimitInfo } from '@/lib/hooks/use-role-chat'

interface RateLimitBannerProps {
  info: RateLimitInfo
  onDismiss: () => void
}

/**
 * Rate limit banner with countdown timer
 */
export function RateLimitBanner({ info, onDismiss }: RateLimitBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState(info.retryAfterSeconds)

  useEffect(() => {
    if (secondsLeft <= 0) {
      onDismiss()
      return
    }

    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsLeft, onDismiss])

  return (
    <div className="flex justify-center my-4">
      <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4 max-w-md">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Rate Limited</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {secondsLeft > 0
                ? `Please wait ${secondsLeft}s before trying again`
                : 'You can try again now'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
