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

// Model pricing per million tokens (as of March 2026)
const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic models
  'claude-opus-4-6': {
    input: 5,
    output: 25,
    cacheWrite: 6.25,
    cacheRead: 0.50,
  },
  'claude-opus-4-5-20251101': {
    input: 5,
    output: 25,
    cacheWrite: 6.25,
    cacheRead: 0.50,
  },
  'claude-sonnet-4-6': {
    input: 3,
    output: 15,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-sonnet-4-5-20250929': {
    input: 3,
    output: 15,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-haiku-4-5': {
    input: 1,
    output: 5,
    cacheWrite: 1.25,
    cacheRead: 0.10,
  },
  // OpenAI models
  'gpt-5.2': {
    input: 1.75,
    output: 14,
    cacheWrite: 0,
    cacheRead: 0,
  },
  'gpt-5': {
    input: 1.25,
    output: 10,
    cacheWrite: 0,
    cacheRead: 0,
  },
  'gpt-5-mini': {
    input: 0.25,
    output: 2,
    cacheWrite: 0,
    cacheRead: 0,
  },
  'gpt-5-nano': {
    input: 0.05,
    output: 0.40,
    cacheWrite: 0,
    cacheRead: 0,
  },
  'o3': {
    input: 2,
    output: 8,
    cacheWrite: 0,
    cacheRead: 0,
  },
  'o4-mini': {
    input: 1.10,
    output: 4.40,
    cacheWrite: 0,
    cacheRead: 0,
  },
}

// Default pricing for unknown models (use Haiku 4.5 as baseline)
const DEFAULT_PRICING: ModelPricing = MODEL_PRICING['claude-haiku-4-5']

/**
 * Get pricing for a specific model.
 * Falls back to default pricing if model is unknown.
 */
function getModelPricing(modelName: string): ModelPricing {
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
