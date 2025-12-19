import { cn } from '@/lib/utils'
import {
  Search,
  Globe,
  Mail,
  Calendar,
  Code,
  Database,
  FileText,
  MessageSquare,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

interface SkillSlotsProps {
  tools: string[]
  maxVisible?: number
  className?: string
}

const toolIcons: Record<string, LucideIcon> = {
  web_search: Search,
  web_fetch: Globe,
  email: Mail,
  calendar: Calendar,
  code: Code,
  database: Database,
  file: FileText,
  chat: MessageSquare,
}

function getToolIcon(tool: string): LucideIcon {
  const normalized = tool.toLowerCase()
  if (toolIcons[normalized]) {
    return toolIcons[normalized]
  }
  for (const [key, icon] of Object.entries(toolIcons)) {
    if (normalized.includes(key)) {
      return icon
    }
  }
  return Wrench
}

function formatToolName(tool: string): string {
  return tool
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function SkillSlots({ tools, maxVisible = 3, className }: SkillSlotsProps) {
  const visibleTools = tools.slice(0, maxVisible)
  const remainingCount = tools.length - maxVisible

  if (tools.length === 0) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        <span className="text-xs text-muted-foreground italic">No tools assigned</span>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visibleTools.map((tool, index) => {
        const Icon = getToolIcon(tool)
        return (
          <span
            key={index}
            className={cn(
              'inline-flex items-center gap-1.5',
              'px-2 py-1 rounded-md',
              'text-xs font-medium',
              'bg-skills-accent/10 text-skills-accent',
              'border border-skills-accent/20'
            )}
          >
            <Icon className="h-3 w-3" />
            {formatToolName(tool)}
          </span>
        )
      })}
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
