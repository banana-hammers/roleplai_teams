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
  Plus,
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

// Legacy vertical list layout (kept for backwards compatibility)
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

interface SkillPillsProps {
  skills: ResolvedSkill[]
  builtInTools?: string[]
  maxVisible?: number
  showEmptyAction?: boolean
  onAddSkill?: () => void
  className?: string
}

// New horizontal pills layout
export function SkillPills({
  skills,
  builtInTools = [],
  maxVisible = 3,
  showEmptyAction = true,
  onAddSkill,
  className,
}: SkillPillsProps) {
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
    if (!showEmptyAction) {
      return (
        <span className={cn('text-xs text-muted-foreground', className)}>
          No skills
        </span>
      )
    }

    return (
      <button
        type="button"
        onClick={onAddSkill}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
          'border-2 border-dashed border-muted-foreground/30',
          'text-xs text-muted-foreground',
          'hover:border-skills-accent hover:text-skills-accent',
          'transition-colors duration-200',
          'active:scale-95',
          className
        )}
      >
        <Plus className="h-3 w-3" />
        <span>Add skills</span>
      </button>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visibleItems.map((item) => {
        const Icon = item.icon
        return (
          <span
            key={item.id}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
              'text-xs font-medium',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
              item.isBuiltIn
                ? 'bg-skills-accent/15 text-skills-accent border border-skills-accent/20'
                : 'bg-muted text-muted-foreground border border-border'
            )}
          >
            <Icon className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{item.name}</span>
          </span>
        )
      })}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground text-xs">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}
