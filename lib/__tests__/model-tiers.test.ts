import { describe, it, expect } from 'vitest'
import {
  getModelTier,
  getModelDisplayName,
  AVAILABLE_MODELS,
  MODEL_REGISTRY,
} from '@/lib/utils/model-tiers'

describe('getModelTier', () => {
  it('returns legendary for opus models', () => {
    const tier = getModelTier('anthropic/claude-opus-4-6')
    expect(tier.tier).toBe('legendary')
    expect(tier.label).toBe('Legendary')
  })

  it('returns rare for sonnet models', () => {
    const tier = getModelTier('anthropic/claude-sonnet-4-6')
    expect(tier.tier).toBe('rare')
  })

  it('returns common for unknown models', () => {
    const tier = getModelTier('anthropic/some-unknown-model')
    expect(tier.tier).toBe('common')
  })

  it('returns common for null input', () => {
    const tier = getModelTier(null)
    expect(tier.tier).toBe('common')
  })
})

describe('getModelDisplayName', () => {
  it('returns display name for known models', () => {
    expect(getModelDisplayName('anthropic/claude-opus-4-6')).toBe('Opus 4.6')
    expect(getModelDisplayName('openai/gpt-5-nano')).toBe('GPT-5 Nano')
  })

  it('returns null for null input', () => {
    expect(getModelDisplayName(null)).toBeNull()
  })

  it('returns model id for unknown models', () => {
    expect(getModelDisplayName('anthropic/unknown')).toBe('unknown')
  })

  it('truncates long unknown model names', () => {
    const name = getModelDisplayName('anthropic/this-is-a-very-long-model-name')
    expect(name!.length).toBeLessThanOrEqual(17) // 14 + "..."
  })
})

describe('AVAILABLE_MODELS', () => {
  it('only contains selectable models', () => {
    const selectableCount = MODEL_REGISTRY.filter(m => m.selectable).length
    expect(AVAILABLE_MODELS).toHaveLength(selectableCount)
  })

  it('includes both providers', () => {
    const providers = new Set(AVAILABLE_MODELS.map(m => m.value.split('/')[0]))
    expect(providers).toContain('anthropic')
    expect(providers).toContain('openai')
  })
})
