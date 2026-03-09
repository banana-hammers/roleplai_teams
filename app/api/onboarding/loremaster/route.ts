import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { buildLoremasterSystemPrompt } from '@/lib/prompts/system-prompt-builder'
import { getSystemModel, errorResponse, DEFAULT_TEMPERATURE } from '@/lib/ai/create-system-model'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'edge'

/**
 * Loremaster Interview Endpoint
 * POST /api/onboarding/loremaster
 *
 * The Loremaster interviews users about their company, founders, and business model.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const rateLimitResult = await rateLimit(
    `onboarding-loremaster:${user.id}`,
    RATE_LIMITS.default.limit,
    RATE_LIMITS.default.windowMs
  )
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  const { messages } = await req.json()

  // Fetch user context
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const userName = profile?.full_name || undefined

  const systemPrompt = buildLoremasterSystemPrompt({ userName })

  const modelResult = getSystemModel()
  if ('error' in modelResult) return modelResult.error

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
