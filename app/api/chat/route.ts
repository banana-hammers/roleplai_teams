import { createClient } from '@/lib/supabase/server'
import { streamText, convertToModelMessages } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { decryptApiKey, isEncryptionConfigured } from '@/lib/crypto/api-key-encryption'
import { rateLimit, rateLimitExceededResponse, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, provider = 'openai', model } = await req.json()

    // SECURITY: Require authentication to prevent abuse of system API keys
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
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

    let apiKey: string | undefined

    // Check for user's BYO API keys
    const { data: apiKeys } = await supabase
      .from('user_api_keys')
      .select('provider, encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .maybeSingle()

    // Decrypt user's API key if available
    if (apiKeys?.encrypted_key && isEncryptionConfigured()) {
      try {
        apiKey = await decryptApiKey(apiKeys.encrypted_key, user.id)
      } catch (error) {
        console.error('Failed to decrypt API key:', error)
        // Fall through to system key
      }
    }

    // Fall back to system API keys
    if (!apiKey) {
      if (provider === 'openai') {
        apiKey = process.env.OPENAI_API_KEY
      } else if (provider === 'anthropic') {
        apiKey = process.env.ANTHROPIC_API_KEY
      }
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'No API key available. Please add your own API key in settings.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize the appropriate AI provider
    let aiProvider
    let modelName = model

    if (provider === 'openai') {
      const openai = createOpenAI({ apiKey })
      modelName = model || 'gpt-4-turbo-preview'
      aiProvider = openai(modelName)
    } else if (provider === 'anthropic') {
      const anthropic = createAnthropic({ apiKey })
      modelName = model || 'claude-haiku-4-5'
      aiProvider = anthropic(modelName)
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported provider' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream the response
    const result = streamText({
      model: aiProvider,
      messages: convertToModelMessages(messages),
      temperature: 0.7,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
