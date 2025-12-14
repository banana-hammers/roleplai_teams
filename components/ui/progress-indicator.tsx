'use client'

import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  className,
}: ProgressIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
