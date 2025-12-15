import { createClient } from '@/lib/supabase/server'
import { streamText, convertToModelMessages } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, provider = 'openai', model } = await req.json()

    // Try to authenticate user (optional for demo)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let apiKey: string | undefined

    // If user is authenticated, check for their BYO API keys
    if (user) {
      const { data: apiKeys } = await supabase
        .from('user_api_keys')
        .select('provider, encrypted_key')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .maybeSingle()

      // Use user's BYO key if available
      if (apiKeys?.encrypted_key) {
        // TODO: Decrypt the API key using Supabase Vault or encryption service
        // For now, we'll use system keys as fallback
        apiKey = undefined
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
      modelName = model || 'claude-sonnet-4-5-20250929'
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
