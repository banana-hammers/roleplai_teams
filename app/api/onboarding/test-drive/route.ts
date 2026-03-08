import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { getSystemModel, errorResponse, DEFAULT_TEMPERATURE } from '@/lib/ai/create-system-model'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { buildTestDrivePrompt } from '@/lib/prompts/system-prompt-builder'

export const runtime = 'edge'

/**
 * Test Drive Chat Endpoint
 * POST /api/onboarding/test-drive
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const rateLimitResult = await rateLimit(
    `onboarding-test-drive:${user.id}`,
    RATE_LIMITS.default.limit,
    RATE_LIMITS.default.windowMs
  )
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  const { messages, identity } = await req.json()

  if (!identity) {
    return errorResponse('Identity core required', 400)
  }

  const modelResult = getSystemModel()
  if ('error' in modelResult) return modelResult.error

  const systemPrompt = buildTestDrivePrompt(identity)

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
