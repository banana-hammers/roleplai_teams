/**
 * Simple in-memory rate limiter for Edge Runtime
 *
 * NOTE: This is a basic implementation. For production at scale,
 * consider using Vercel KV, Upstash Redis, or similar.
 *
 * Limitations:
 * - Memory is not shared across edge instances
 * - Resets on deployment/restart
 * - Not suitable for distributed rate limiting
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (per-instance)
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60000 // 1 minute
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
  lastCleanup = now
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limit: number
}

/**
 * Check rate limit for an identifier
 *
 * @param identifier - Unique identifier (user ID, IP, etc.)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result with success status and metadata
 */
export async function rateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  cleanup()

  const now = Date.now()
  const key = identifier

  let entry = store.get(key)

  // Create new entry if doesn't exist or window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    }
  }

  // Increment count
  entry.count++
  store.set(key, entry)

  const remaining = Math.max(0, limit - entry.count)
  const success = entry.count <= limit

  return {
    success,
    remaining,
    reset: entry.resetAt,
    limit,
  }
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  }
}

/**
 * Create a 429 Too Many Requests response
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        ...rateLimitHeaders(result),
      },
    }
  )
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Chat endpoints - more expensive, lower limits
  chat: { limit: 30, windowMs: 60000 },        // 30 requests/minute
  agent: { limit: 20, windowMs: 60000 },       // 20 requests/minute

  // API key management - sensitive operations
  apiKeys: { limit: 10, windowMs: 60000 },     // 10 requests/minute

  // General API - higher limits
  default: { limit: 60, windowMs: 60000 },     // 60 requests/minute

  // Auth-related - prevent brute force
  auth: { limit: 10, windowMs: 300000 },       // 10 requests/5 minutes
} as const
