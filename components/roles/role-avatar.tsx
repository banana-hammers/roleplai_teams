import { cn } from '@/lib/utils'
import { type ArchetypeType, archetypeConfigs } from '@/lib/utils/derive-archetype'

interface RoleAvatarProps {
  archetype: ArchetypeType
  className?: string
}

export function RoleAvatar({ archetype, className }: RoleAvatarProps) {
  const config = archetypeConfigs[archetype]
  const Icon = config.icon

  return (
    <div
      data-slot="avatar-area"
      className={cn(
        'relative h-[120px] w-full',
        'flex items-center justify-center',
        'bg-gradient-to-br from-roles-accent/20 via-transparent to-roles-accent/10',
        'transition-all duration-300',
        'group-hover:from-roles-accent/30 group-hover:to-roles-accent/20',
        className
      )}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-roles-accent/30 rounded-tl" />
      <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-roles-accent/30 rounded-tr" />
      <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-roles-accent/30 rounded-bl" />
      <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-roles-accent/30 rounded-br" />

      {/* Icon container */}
      <div
        className={cn(
          'flex items-center justify-center',
          'h-16 w-16 rounded-full',
          'bg-gradient-to-br from-card via-card to-muted',
          'border-2',
          config.borderClass,
          'shadow-lg shadow-black/5',
          'transition-transform duration-300',
          'group-hover:scale-110'
        )}
      >
        <Icon className={cn('h-8 w-8', config.colorClass)} />
      </div>
    </div>
  )
}
