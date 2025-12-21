import { Brain, Shield, Zap, Lightbulb, Target, type LucideIcon } from 'lucide-react'

export type ArchetypeType = 'strategist' | 'guardian' | 'executor' | 'advisor' | 'specialist'

export interface ArchetypeConfig {
  icon: LucideIcon
  label: string
  colorClass: string
  bgClass: string
  borderClass: string
}

export const archetypeConfigs: Record<ArchetypeType, ArchetypeConfig> = {
  strategist: {
    icon: Brain,
    label: 'Strategist',
    colorClass: 'text-roles-accent',
    bgClass: 'bg-roles-accent/10',
    borderClass: 'border-roles-accent/20',
  },
  guardian: {
    icon: Shield,
    label: 'Guardian',
    colorClass: 'text-identity-accent',
    bgClass: 'bg-identity-accent/10',
    borderClass: 'border-identity-accent/20',
  },
  executor: {
    icon: Zap,
    label: 'Executor',
    colorClass: 'text-skills-accent',
    bgClass: 'bg-skills-accent/10',
    borderClass: 'border-skills-accent/20',
  },
  advisor: {
    icon: Lightbulb,
    label: 'Advisor',
    colorClass: 'text-context-accent',
    bgClass: 'bg-context-accent/10',
    borderClass: 'border-context-accent/20',
  },
  specialist: {
    icon: Target,
    label: 'Specialist',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/20',
  },
}

export function deriveArchetype(role: {
  resolved_skills?: Array<{ name: string }>
  skillCount?: number
  approval_policy?: string
  description?: string
  instructions?: string
}): ArchetypeType {
  const { resolved_skills = [], skillCount, approval_policy, description = '', instructions = '' } = role
  const text = `${description} ${instructions}`.toLowerCase()
  const numSkills = skillCount ?? resolved_skills.length

  // Guardian: High trust requirements
  if (approval_policy === 'always') {
    return 'guardian'
  }

  // Executor: Many skills, autonomous
  if (numSkills >= 3 && approval_policy === 'never') {
    return 'executor'
  }

  // Strategist: Research/analysis focused
  if (
    resolved_skills.some(s => s.name.toLowerCase().includes('search')) ||
    text.includes('research') ||
    text.includes('analyz') ||
    text.includes('strateg')
  ) {
    return 'strategist'
  }

  // Advisor: Consultation/guidance
  if (
    text.includes('advis') ||
    text.includes('consult') ||
    text.includes('recommend') ||
    text.includes('guide') ||
    text.includes('mentor')
  ) {
    return 'advisor'
  }

  // Default: Specialist
  return 'specialist'
}
