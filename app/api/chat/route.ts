import { createClient } from '@/lib/supabase/server'
import { streamText, convertToModelMessages } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'
import { resolveApiKey } from '@/lib/ai/resolve-api-key'
import { errorResponse, DEFAULT_TEMPERATURE } from '@/lib/ai/create-system-model'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, provider = 'openai', model } = await req.json()

    // SAFETY: Validate messages input
    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse('Messages must be a non-empty array', 400)
    }
    if (messages.length > 200) {
      return errorResponse('Too many messages', 400)
    }

    // SECURITY: Require authentication to prevent abuse of system API keys
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // SECURITY: Rate limit by user ID
    const rateLimitResult = await rateLimit(
      `chat:${user.id}`,
      RATE_LIMITS.chat.limit,
      RATE_LIMITS.chat.windowMs
    )

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    const apiKey = await resolveApiKey(supabase, user.id, provider)

    if (!apiKey) {
      return errorResponse('No API key available. Please add your own API key in settings.', 400)
    }

    // Initialize the appropriate AI provider
    let aiProvider
    let modelName = model

    if (provider === 'openai') {
      const openai = createOpenAI({ apiKey })
      modelName = model || 'gpt-5-nano'
      aiProvider = openai(modelName)
    } else if (provider === 'anthropic') {
      const anthropic = createAnthropic({ apiKey })
      modelName = model || 'claude-haiku-4-5'
      aiProvider = anthropic(modelName)
    } else {
      return errorResponse('Unsupported provider', 400)
    }

    // Stream the response
    const result = streamText({
      model: aiProvider,
      messages: await convertToModelMessages(messages),
      temperature: DEFAULT_TEMPERATURE,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return errorResponse('Internal server error', 500)
  }
}
