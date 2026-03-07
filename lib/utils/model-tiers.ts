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

// ── Single source of truth for all models ──────────────────────────

export interface ModelRegistryEntry {
  /** Full provider/model value, e.g. 'anthropic/claude-opus-4-6' */
  value: string
  /** Raw model ID, e.g. 'claude-opus-4-6' */
  modelId: string
  /** Short display name, e.g. 'Opus 4.6' */
  displayName: string
  /** Full label for UI picker, e.g. 'Claude Opus 4.6' */
  label: string
  tier: ModelTier
  /** Whether to show in the model selection UI */
  selectable: boolean
}

export const MODEL_REGISTRY: ModelRegistryEntry[] = [
  // ── Anthropic ──
  { value: 'anthropic/claude-opus-4-6',           modelId: 'claude-opus-4-6',           displayName: 'Opus 4.6',   label: 'Claude Opus 4.6',   tier: 'legendary', selectable: true  },
  { value: 'anthropic/claude-opus-4-5-20251101',  modelId: 'claude-opus-4-5-20251101',  displayName: 'Opus 4.5',   label: 'Claude Opus 4.5',   tier: 'legendary', selectable: false },
  { value: 'anthropic/claude-opus-4-20250514',    modelId: 'claude-opus-4-20250514',    displayName: 'Opus 4',     label: 'Claude Opus 4',     tier: 'epic',      selectable: false },
  { value: 'anthropic/claude-sonnet-4-6',         modelId: 'claude-sonnet-4-6',         displayName: 'Sonnet 4.6', label: 'Claude Sonnet 4.6', tier: 'rare',      selectable: true  },
  { value: 'anthropic/claude-sonnet-4-5-20250929',modelId: 'claude-sonnet-4-5-20250929',displayName: 'Sonnet 4.5', label: 'Claude Sonnet 4.5', tier: 'rare',      selectable: false },
  { value: 'anthropic/claude-haiku-4-5',          modelId: 'claude-haiku-4-5',          displayName: 'Haiku 4.5',  label: 'Claude Haiku 4.5',  tier: 'common',    selectable: true  },

  // ── OpenAI ──
  { value: 'openai/gpt-5.2',      modelId: 'gpt-5.2',      displayName: 'GPT-5.2',      label: 'GPT-5.2',      tier: 'legendary', selectable: true  },
  { value: 'openai/gpt-5.2-pro',  modelId: 'gpt-5.2-pro',  displayName: 'GPT-5.2 Pro',  label: 'GPT-5.2 Pro',  tier: 'legendary', selectable: false },
  { value: 'openai/o3',           modelId: 'o3',            displayName: 'o3',            label: 'o3',            tier: 'legendary', selectable: true  },
  { value: 'openai/o3-pro',       modelId: 'o3-pro',        displayName: 'o3 Pro',        label: 'o3 Pro',        tier: 'legendary', selectable: false },
  { value: 'openai/gpt-5',        modelId: 'gpt-5',         displayName: 'GPT-5',         label: 'GPT-5',         tier: 'epic',      selectable: true  },
  { value: 'openai/gpt-4.1',      modelId: 'gpt-4.1',       displayName: 'GPT-4.1',       label: 'GPT-4.1',       tier: 'epic',      selectable: false },
  { value: 'openai/o4-mini',      modelId: 'o4-mini',       displayName: 'o4-mini',       label: 'o4-mini',       tier: 'epic',      selectable: true  },
  { value: 'openai/gpt-4o',       modelId: 'gpt-4o',        displayName: 'GPT-4o',        label: 'GPT-4o',        tier: 'epic',      selectable: false },
  { value: 'openai/gpt-5-mini',   modelId: 'gpt-5-mini',    displayName: 'GPT-5 Mini',    label: 'GPT-5 Mini',    tier: 'rare',      selectable: true  },
  { value: 'openai/gpt-4.1-mini', modelId: 'gpt-4.1-mini',  displayName: 'GPT-4.1 Mini',  label: 'GPT-4.1 Mini',  tier: 'rare',      selectable: false },
  { value: 'openai/gpt-4o-mini',  modelId: 'gpt-4o-mini',   displayName: 'GPT-4o Mini',   label: 'GPT-4o Mini',   tier: 'rare',      selectable: false },
  { value: 'openai/gpt-5-nano',   modelId: 'gpt-5-nano',    displayName: 'GPT-5 Nano',    label: 'GPT-5 Nano',    tier: 'common',    selectable: true  },
  { value: 'openai/gpt-4.1-nano', modelId: 'gpt-4.1-nano',  displayName: 'GPT-4.1 Nano',  label: 'GPT-4.1 Nano',  tier: 'common',    selectable: false },
]

// ── Derived lookups (built once from the registry) ─────────────────

const tierByValue = new Map(MODEL_REGISTRY.map(m => [m.value, m.tier]))
const displayNameByModelId = new Map(MODEL_REGISTRY.map(m => [m.modelId, m.displayName]))

export function getModelTier(modelPreference: string | null): ModelTierConfig {
  if (!modelPreference) {
    return modelTierConfigs.common
  }

  const tier = tierByValue.get(modelPreference) || 'common'
  return modelTierConfigs[tier]
}

export function getModelDisplayName(modelPreference: string | null): string | null {
  if (!modelPreference) return null

  const parts = modelPreference.split('/')
  const modelId = parts[1] || parts[0]

  return displayNameByModelId.get(modelId) || (modelId.length > 14 ? modelId.slice(0, 14) + '...' : modelId)
}

/** Models shown in the UI model picker */
export const AVAILABLE_MODELS: Array<{ value: string; label: string; tier: ModelTier }> =
  MODEL_REGISTRY
    .filter(m => m.selectable)
    .map(({ value, label, tier }) => ({ value, label, tier }))

/** All known model IDs (for pricing lookups, etc.) */
export const ALL_MODEL_IDS: string[] = MODEL_REGISTRY.map(m => m.modelId)
