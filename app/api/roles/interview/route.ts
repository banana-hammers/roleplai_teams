import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { buildNovaRolePrompt } from '@/lib/prompts/system-prompt-builder'
import type { IdentityCore } from '@/types/identity'
import { getSystemModel, errorResponse, DEFAULT_TEMPERATURE } from '@/lib/ai/create-system-model'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'edge'

/**
 * AI Role Interview Endpoint with Nova
 * POST /api/roles/interview
 *
 * Nova interviews users to design their RoleplAIr.
 * Nova knows their identity core and builds roles that complement it.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const rateLimitResult = await rateLimit(
    `roles-interview:${user.id}`,
    RATE_LIMITS.default.limit,
    RATE_LIMITS.default.windowMs
  )
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  const { messages } = await req.json()

  // Fetch user context - identity core is important
  const [profileResult, identityResult] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('identity_cores').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  const userName = profileResult.data?.full_name || undefined
  const identityCore = identityResult.data as IdentityCore | null

  // Build Nova's system prompt with user's identity context
  const systemPrompt = buildNovaRolePrompt({
    userName,
    identityCore,
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
