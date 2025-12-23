/**
 * API Error Types
 *
 * Custom error classes for handling API rate limits and other transient errors.
 * Edge-runtime compatible.
 */

/**
 * Rate limit error from AI provider
 */
export class RateLimitError extends Error {
  public readonly statusCode = 429
  public readonly retryAfterMs: number
  public readonly provider: 'anthropic' | 'openai' | 'unknown'

  constructor(
    message: string,
    retryAfterMs: number = 60000,
    provider: 'anthropic' | 'openai' | 'unknown' = 'unknown'
  ) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfterMs = retryAfterMs
    this.provider = provider
  }
}

/**
 * User-friendly error messages for different error types
 */
export const ERROR_MESSAGES = {
  RATE_LIMIT: 'The AI service is currently busy. Please wait a moment and try again.',
  RATE_LIMIT_WITH_RETRY: (seconds: number) =>
    `The AI service is currently busy. Please try again in ${seconds} seconds.`,
  TRANSIENT_ERROR: 'A temporary error occurred. Please try again.',
  UNKNOWN_ERROR: 'An error occurred while processing your request.',
} as const

/**
 * Check if an error is a rate limit error (429)
 * Works with both Anthropic SDK errors and standard Error objects
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof RateLimitError) return true

  // Anthropic SDK throws APIError with status property
  if (error && typeof error === 'object') {
    const err = error as { status?: number; statusCode?: number; message?: string }

    // Check status code
    if (err.status === 429 || err.statusCode === 429) return true

    // Check message for rate limit indicators
    if (err.message && typeof err.message === 'string') {
      const msg = err.message.toLowerCase()
      return msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')
    }
  }

  return false
}

/**
 * Extract retry-after value from error (in milliseconds)
 * Returns default value if not available
 */
export function getRetryAfterMs(error: unknown, defaultMs: number = 60000): number {
  if (error instanceof RateLimitError) return error.retryAfterMs

  if (error && typeof error === 'object') {
    // Check for headers object with retry-after
    const err = error as {
      headers?: { get?: (key: string) => string | null; 'retry-after'?: string }
      retryAfter?: number
    }

    // Try headers.get() method (fetch Response style)
    if (err.headers?.get) {
      const retryAfter = err.headers.get('retry-after')
      if (retryAfter) {
        const parsed = parseInt(retryAfter, 10)
        if (!isNaN(parsed)) return parsed * 1000
      }
    }

    // Try direct header access
    if (err.headers?.['retry-after']) {
      const retryAfter = parseInt(err.headers['retry-after'], 10)
      if (!isNaN(retryAfter)) return retryAfter * 1000
    }

    // Check for retryAfter property
    if (typeof err.retryAfter === 'number') {
      return err.retryAfter * 1000
    }
  }

  return defaultMs
}

/**
 * Check if an error is a transient error that might succeed on retry
 * Includes rate limits, timeouts, and 5xx errors
 */
export function isTransientError(error: unknown): boolean {
  if (isRateLimitError(error)) return true

  if (error && typeof error === 'object') {
    const err = error as { status?: number; statusCode?: number; code?: string; message?: string }
    const status = err.status || err.statusCode

    // 5xx server errors
    if (status && status >= 500 && status < 600) return true

    // Network/timeout errors
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || err.code === 'ECONNABORTED')
      return true
    if (err.message?.toLowerCase().includes('timeout')) return true
    if (err.message?.toLowerCase().includes('network')) return true
  }

  return false
}
