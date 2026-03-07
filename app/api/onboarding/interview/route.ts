import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { buildNovaSystemPrompt } from '@/lib/prompts/system-prompt-builder'
import { getSystemModel, errorResponse, DEFAULT_TEMPERATURE } from '@/lib/ai/create-system-model'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'edge'

/**
 * AI Personality Interview Endpoint
 * POST /api/onboarding/interview
 *
 * Nova interviews users to understand their personality.
 * She's aware of who she's talking to and adapts her approach.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const rateLimitResult = await rateLimit(
    `onboarding-interview:${user.id}`,
    RATE_LIMITS.default.limit,
    RATE_LIMITS.default.windowMs
  )
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  const { messages } = await req.json()

  // Fetch user context for Nova
  const [profileResult, rolesResult, identityResult] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('roles').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('identity_cores').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  const userName = profileResult.data?.full_name || undefined
  const existingRolesCount = rolesResult.count || 0
  const isReturningUser = !!identityResult.data

  // Build Nova's system prompt with user context
  const systemPrompt = buildNovaSystemPrompt({
    userName,
    existingRolesCount,
    isReturningUser,
  })

  const modelResult = getSystemModel()
  if ('error' in modelResult) return modelResult.error

  // Stream the interview conversation
  const result = streamText({
    model: modelResult.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...await convertToModelMessages(messages),
    ],
    temperature: DEFAULT_TEMPERATURE,
  })

  return result.toUIMessageStreamResponse()
}
