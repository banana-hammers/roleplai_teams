import { cn } from '@/lib/utils'

interface PersonalityTraitsProps {
  facets: Record<string, unknown>
  maxVisible?: number
  className?: string
}

function extractTraits(facets: Record<string, unknown>): string[] {
  const traits: string[] = []

  // Extract tone_adjustment as primary trait
  if (facets.tone_adjustment && typeof facets.tone_adjustment === 'string') {
    traits.push(facets.tone_adjustment)
  }

  // Extract priority_override items
  if (Array.isArray(facets.priority_override)) {
    for (const priority of facets.priority_override) {
      if (typeof priority === 'string') {
        traits.push(priority)
      }
    }
  }

  // Extract special_behaviors
  if (Array.isArray(facets.special_behaviors)) {
    for (const behavior of facets.special_behaviors) {
      if (typeof behavior === 'string') {
        traits.push(behavior)
      }
    }
  }

  // Extract any other string values from top-level keys
  for (const [key, value] of Object.entries(facets)) {
    if (
      typeof value === 'string' &&
      !['tone_adjustment'].includes(key) &&
      !traits.includes(value)
    ) {
      traits.push(value)
    }
  }

  return traits
}

function truncateTrait(trait: string, maxLength: number = 24): string {
  if (trait.length <= maxLength) return trait
  return trait.slice(0, maxLength) + '...'
}

export function PersonalityTraits({
  facets,
  maxVisible = 3,
  className,
}: PersonalityTraitsProps) {
  const traits = extractTraits(facets)
  const visibleTraits = traits.slice(0, maxVisible)
  const remainingCount = traits.length - maxVisible

  if (traits.length === 0) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        <span className="text-xs text-muted-foreground italic">No traits defined</span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visibleTraits.map((trait, index) => (
        <span
          key={index}
          title={trait}
          className={cn(
            'inline-flex items-center',
            'px-2 py-1 rounded-md',
            'text-xs font-medium',
            'bg-identity-accent/10 text-identity-accent',
            'border border-identity-accent/20'
          )}
        >
          {truncateTrait(trait)}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className={cn(
            'inline-flex items-center',
            'px-2 py-1 rounded-md',
            'text-xs font-medium',
            'bg-muted text-muted-foreground',
            'border border-border'
          )}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  )
}
