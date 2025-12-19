import { cn } from '@/lib/utils'
import { type ArchetypeType, archetypeConfigs } from '@/lib/utils/derive-archetype'

interface ArchetypeBadgeProps {
  archetype: ArchetypeType
  className?: string
}

export function ArchetypeBadge({ archetype, className }: ArchetypeBadgeProps) {
  const config = archetypeConfigs[archetype]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        'px-2 py-0.5 rounded-full',
        'text-[10px] font-semibold uppercase tracking-wider',
        config.bgClass,
        config.colorClass,
        'border',
        config.borderClass,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
