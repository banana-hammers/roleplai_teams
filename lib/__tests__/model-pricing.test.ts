import { describe, it, expect } from 'vitest'
import { calculateMessageCost, formatCost } from '@/lib/pricing/model-pricing'

describe('calculateMessageCost', () => {
  it('calculates cost for known Anthropic model', () => {
    const cost = calculateMessageCost('claude-haiku-4-5', {
      inputTokens: 1000,
      outputTokens: 500,
    })
    // input: 1000 * 1 / 1M = 0.001, output: 500 * 5 / 1M = 0.0025
    expect(cost).toBeCloseTo(0.0035, 5)
  })

  it('includes cache token costs', () => {
    const withCache = calculateMessageCost('claude-sonnet-4-6', {
      inputTokens: 1000,
      outputTokens: 500,
      cacheCreationTokens: 2000,
      cacheReadTokens: 3000,
    })
    const withoutCache = calculateMessageCost('claude-sonnet-4-6', {
      inputTokens: 1000,
      outputTokens: 500,
    })
    expect(withCache).toBeGreaterThan(withoutCache)
  })

  it('uses default pricing for unknown models', () => {
    const cost = calculateMessageCost('unknown-model', {
      inputTokens: 1000,
      outputTokens: 500,
    })
    // Should use haiku pricing as default
    expect(cost).toBeGreaterThan(0)
  })

  it('returns 0 for zero tokens', () => {
    const cost = calculateMessageCost('claude-haiku-4-5', {
      inputTokens: 0,
      outputTokens: 0,
    })
    expect(cost).toBe(0)
  })
})

describe('formatCost', () => {
  it('formats tiny costs', () => {
    expect(formatCost(0.00001)).toBe('<$0.0001')
  })

  it('formats small costs with 4 decimals', () => {
    expect(formatCost(0.0035)).toBe('$0.0035')
  })

  it('formats medium costs with 3 decimals', () => {
    expect(formatCost(0.125)).toBe('$0.125')
  })

  it('formats large costs with 2 decimals', () => {
    expect(formatCost(1.5)).toBe('$1.50')
  })
})
