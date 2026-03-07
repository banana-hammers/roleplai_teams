/**
 * Distributed rate limiter using Supabase RPC
 *
 * Uses a Supabase-backed atomic counter for production (shared across Edge instances).
 * Falls back to in-memory rate limiting if Supabase is unavailable.
 */

import { createClient } from '@/lib/supabase/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory fallback store (per-instance)
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
 * In-memory rate limiter (fallback when Supabase is unavailable)
 */
function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanup()

  const now = Date.now()
  let entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    }
  }

  entry.count++
  store.set(identifier, entry)

  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    reset: entry.resetAt,
    limit,
  }
}

/**
 * Check rate limit for an identifier using Supabase RPC.
 * Falls back to in-memory if Supabase is unavailable.
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
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: identifier,
      p_limit: limit,
      p_window_ms: windowMs,
    })

    if (error) throw error

    const row = Array.isArray(data) ? data[0] : data

    if (!row) throw new Error('No data returned from check_rate_limit')

    return {
      success: row.success,
      remaining: row.remaining,
      reset: new Date(row.reset_at).getTime(),
      limit,
    }
  } catch (err) {
    console.warn('[RateLimit] Supabase unavailable, falling back to in-memory:', err)
    return inMemoryRateLimit(identifier, limit, windowMs)
  }
}

/**
 * Create rate limit headers for response
 */
function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
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

  // General API - higher limits
  default: { limit: 60, windowMs: 60000 },     // 60 requests/minute
} as const
