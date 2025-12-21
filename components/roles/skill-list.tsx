'use client'

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
import type { ResolvedSkill } from '@/types/role'

// Built-in tool definitions
const BUILTIN_TOOLS: Record<string, { name: string; icon: LucideIcon }> = {
  web_search: { name: 'Web Search', icon: Search },
  web_fetch: { name: 'Web Fetch', icon: Globe },
}

// Icon mapping for custom skills based on keywords
function getSkillIcon(name: string): LucideIcon {
  const lower = name.toLowerCase()
  if (lower.includes('search')) return Search
  if (lower.includes('web') || lower.includes('fetch') || lower.includes('url')) return Globe
  if (lower.includes('email') || lower.includes('mail')) return Mail
  if (lower.includes('calendar') || lower.includes('schedule')) return Calendar
  if (lower.includes('code') || lower.includes('program')) return Code
  if (lower.includes('data') || lower.includes('database')) return Database
  if (lower.includes('file') || lower.includes('document')) return FileText
  if (lower.includes('chat') || lower.includes('message')) return MessageSquare
  return Wrench
}

interface SkillListProps {
  skills: ResolvedSkill[]
  builtInTools?: string[]
  maxVisible?: number
  className?: string
}

export function SkillList({
  skills,
  builtInTools = [],
  maxVisible = 4,
  className,
}: SkillListProps) {
  // Combine built-in tools and custom skills
  const allItems: { id: string; name: string; icon: LucideIcon; isBuiltIn: boolean }[] = []

  // Add built-in tools first
  for (const toolId of builtInTools) {
    const tool = BUILTIN_TOOLS[toolId]
    if (tool) {
      allItems.push({
        id: toolId,
        name: tool.name,
        icon: tool.icon,
        isBuiltIn: true,
      })
    }
  }

  // Add custom skills
  for (const skill of skills) {
    allItems.push({
      id: skill.id,
      name: skill.name,
      icon: getSkillIcon(skill.name),
      isBuiltIn: false,
    })
  }

  const visibleItems = allItems.slice(0, maxVisible)
  const remainingCount = allItems.length - maxVisible

  if (allItems.length === 0) {
    return (
      <div className={cn('text-xs text-muted-foreground italic', className)}>
        No skills equipped
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {visibleItems.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.id}
            className="flex items-center gap-2 text-xs"
          >
            <Icon className={cn(
              'h-3.5 w-3.5 shrink-0',
              item.isBuiltIn ? 'text-skills-accent' : 'text-muted-foreground'
            )} />
            <span className="truncate">{item.name}</span>
          </div>
        )
      })}
      {remainingCount > 0 && (
        <div className="text-[10px] text-muted-foreground pl-5">
          +{remainingCount} more
        </div>
      )}
    </div>
  )
}
