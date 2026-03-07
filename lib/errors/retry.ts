/**
 * Retry Utility
 *
 * Exponential backoff retry logic for handling transient errors.
 * Edge-runtime compatible.
 */

import { isRateLimitError, isTransientError, getRetryAfterMs } from './api-errors'

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number
  /** Maximum delay in milliseconds (default: 60000) */
  maxDelayMs?: number
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number
  /** Add random jitter to prevent thundering herd (default: true) */
  jitter?: boolean
  /** Only retry on rate limit errors, not other transient errors (default: false) */
  onlyRateLimits?: boolean
  /** Callback invoked before each retry attempt */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  jitter: true,
  onlyRateLimits: false,
}

/**
 * Calculate delay for the next retry attempt
 */
function calculateDelay(
  attempt: number,
  options: Required<Omit<RetryOptions, 'onRetry'>>,
  error: unknown
): number {
  // For rate limits, respect the Retry-After header if present
  if (isRateLimitError(error)) {
    const retryAfter = getRetryAfterMs(error, options.initialDelayMs)
    // Use the larger of retry-after or calculated delay
    const calculatedDelay = Math.min(
      options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1),
      options.maxDelayMs
    )
    return Math.max(retryAfter, calculatedDelay)
  }

  // Standard exponential backoff
  let delay = Math.min(
    options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1),
    options.maxDelayMs
  )

  // Add jitter (0-25% of delay)
  if (options.jitter) {
    delay = delay + Math.random() * delay * 0.25
  }

  return Math.floor(delay)
}

/**
 * Check if the error should trigger a retry
 */
function shouldRetry(error: unknown, options: Required<Omit<RetryOptions, 'onRetry'>>): boolean {
  if (options.onlyRateLimits) {
    return isRateLimitError(error)
  }
  return isTransientError(error)
}

/**
 * Sleep for the specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Execute an async function with exponential backoff retry
 *
 * @example
 * const result = await withRetry(
 *   () => anthropic.messages.create({ ... }),
 *   { maxRetries: 3, onRetry: (attempt, err) => console.log(`Retry ${attempt}`) }
 * )
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if we should retry
      if (attempt <= opts.maxRetries && shouldRetry(error, opts)) {
        const delayMs = calculateDelay(attempt, opts, error)

        // Call retry callback
        options.onRetry?.(attempt, error, delayMs)

        await sleep(delayMs)
        continue
      }

      // No more retries or non-retryable error
      throw error
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError
}

