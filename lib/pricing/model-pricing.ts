/**
 * Model pricing configuration and cost calculation utilities.
 * Prices are per million tokens (MTok).
 */

export interface ModelPricing {
  input: number        // Price per million input tokens
  output: number       // Price per million output tokens
  cacheWrite: number   // Price per million cache write tokens
  cacheRead: number    // Price per million cache read tokens
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
}

// Anthropic pricing per million tokens (as of 2025)
const MODEL_PRICING: Record<string, ModelPricing> = {
  // Opus 4.5 - Most intelligent
  'claude-opus-4-5-20251101': {
    input: 5,
    output: 25,
    cacheWrite: 6.25,
    cacheRead: 0.50,
  },
  // Sonnet 4.5 - Optimal balance
  'claude-sonnet-4-5-20250929': {
    input: 3,
    output: 15,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  // Haiku 4.5 - Fastest, most cost-efficient
  'claude-haiku-4-5': {
    input: 1,
    output: 5,
    cacheWrite: 1.25,
    cacheRead: 0.10,
  },
  // Legacy models
  'claude-3-opus-20240229': {
    input: 15,
    output: 75,
    cacheWrite: 18.75,
    cacheRead: 1.50,
  },
  'claude-3-5-sonnet-20241022': {
    input: 3,
    output: 15,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
    cacheWrite: 0.30,
    cacheRead: 0.03,
  },
}

// Default pricing for unknown models (use Haiku 4.5 as baseline)
const DEFAULT_PRICING: ModelPricing = MODEL_PRICING['claude-haiku-4-5']

/**
 * Get pricing for a specific model.
 * Falls back to default pricing if model is unknown.
 */
export function getModelPricing(modelName: string): ModelPricing {
  return MODEL_PRICING[modelName] || DEFAULT_PRICING
}

/**
 * Calculate the cost of a message based on token usage.
 * Returns cost in dollars.
 */
export function calculateMessageCost(modelName: string, usage: TokenUsage): number {
  const pricing = getModelPricing(modelName)

  // Calculate cost (prices are per million tokens)
  const inputCost = (usage.inputTokens * pricing.input) / 1_000_000
  const outputCost = (usage.outputTokens * pricing.output) / 1_000_000
  const cacheWriteCost = ((usage.cacheCreationTokens || 0) * pricing.cacheWrite) / 1_000_000
  const cacheReadCost = ((usage.cacheReadTokens || 0) * pricing.cacheRead) / 1_000_000

  // Cache read tokens replace regular input tokens, so we need to adjust
  // The input tokens from Anthropic already excludes cache read tokens
  return inputCost + outputCost + cacheWriteCost + cacheReadCost
}

/**
 * Format a cost value for display.
 * Shows appropriate precision based on magnitude.
 */
export function formatCost(cost: number): string {
  if (cost < 0.0001) {
    return '<$0.0001'
  } else if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  } else if (cost < 1) {
    return `$${cost.toFixed(3)}`
  } else {
    return `$${cost.toFixed(2)}`
  }
}
