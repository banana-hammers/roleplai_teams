import { Crown, Star, Gem, Shield, type LucideIcon } from 'lucide-react'

export type ModelTier = 'legendary' | 'epic' | 'rare' | 'common'

export interface ModelTierConfig {
  tier: ModelTier
  label: string
  icon: LucideIcon
  colorClass: string
  bgClass: string
  borderClass: string
  glowClass: string
}

export const modelTierConfigs: Record<ModelTier, ModelTierConfig> = {
  legendary: {
    tier: 'legendary',
    label: 'Legendary',
    icon: Crown,
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/40',
    glowClass: 'shadow-lg shadow-amber-500/20',
  },
  epic: {
    tier: 'epic',
    label: 'Epic',
    icon: Gem,
    colorClass: 'text-indigo-400',
    bgClass: 'bg-indigo-400/15',
    borderClass: 'border-indigo-400/40',
    glowClass: 'shadow-lg shadow-indigo-400/20',
  },
  rare: {
    tier: 'rare',
    label: 'Rare',
    icon: Star,
    colorClass: 'text-teal-500',
    bgClass: 'bg-teal-500/15',
    borderClass: 'border-teal-500/40',
    glowClass: 'shadow-lg shadow-teal-500/20',
  },
  common: {
    tier: 'common',
    label: 'Common',
    icon: Shield,
    colorClass: 'text-slate-400',
    bgClass: 'bg-slate-400/10',
    borderClass: 'border-slate-400/30',
    glowClass: '',
  },
}

// Model to tier mapping based on cost/capability
const modelTierMap: Record<string, ModelTier> = {
  // Legendary tier (most expensive/capable)
  'anthropic/claude-opus-4-20250514': 'legendary',
  'anthropic/claude-opus-4-5-20251101': 'legendary',
  'openai/gpt-4o': 'legendary',
  'openai/o1-preview': 'legendary',
  'openai/o1': 'legendary',

  // Epic tier
  'openai/gpt-4-turbo-preview': 'epic',
  'openai/gpt-4-turbo': 'epic',
  'anthropic/claude-3-opus': 'epic',
  'anthropic/claude-3-opus-20240229': 'epic',

  // Rare tier
  'anthropic/claude-sonnet-4-5-20250929': 'rare',
  'anthropic/claude-3-5-sonnet': 'rare',
  'anthropic/claude-3-5-sonnet-20241022': 'rare',
  'openai/gpt-4o-mini': 'rare',

  // Common tier (default/base)
  'anthropic/claude-haiku-4-5': 'common',
  'anthropic/claude-3-haiku': 'common',
  'anthropic/claude-3-haiku-20240307': 'common',
  'openai/gpt-3.5-turbo': 'common',
}

export function getModelTier(modelPreference: string | null): ModelTierConfig {
  if (!modelPreference) {
    return modelTierConfigs.common
  }

  const tier = modelTierMap[modelPreference] || 'common'
  return modelTierConfigs[tier]
}

// Friendly display names for models
const friendlyNames: Record<string, string> = {
  'claude-opus-4-20250514': 'Opus 4',
  'claude-opus-4-5-20251101': 'Opus 4.5',
  'claude-sonnet-4-5-20250929': 'Sonnet 4.5',
  'claude-3-5-sonnet-20241022': 'Sonnet 3.5',
  'claude-3-opus-20240229': 'Opus 3',
  'claude-haiku-4-5': 'Haiku 4.5',
  'claude-3-haiku-20240307': 'Haiku 3',
  'gpt-4o': 'GPT-4o',
  'gpt-4-turbo-preview': 'GPT-4 Turbo',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-3.5-turbo': 'GPT-3.5',
  'o1-preview': 'o1 Preview',
  'o1': 'o1',
}

export function getModelDisplayName(modelPreference: string | null): string | null {
  if (!modelPreference) return null

  const parts = modelPreference.split('/')
  const model = parts[1] || parts[0]

  return friendlyNames[model] || (model.length > 14 ? model.slice(0, 14) + '...' : model)
}

// Available Claude models for selection
export const CLAUDE_MODELS: Array<{ value: string; label: string; tier: ModelTier }> = [
  { value: 'anthropic/claude-opus-4-5-20251101', label: 'Claude Opus 4.5', tier: 'legendary' },
  { value: 'anthropic/claude-opus-4-20250514', label: 'Claude Opus 4', tier: 'legendary' },
  { value: 'anthropic/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', tier: 'rare' },
  { value: 'anthropic/claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', tier: 'rare' },
  { value: 'anthropic/claude-haiku-4-5', label: 'Claude Haiku 4.5', tier: 'common' },
  { value: 'anthropic/claude-3-haiku-20240307', label: 'Claude 3 Haiku', tier: 'common' },
]
