import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { buildNovaSystemPrompt } from '@/lib/prompts/system-prompt-builder'

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
    return new Response('Unauthorized', { status: 401 })
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

  // Use Anthropic as primary, OpenAI as fallback
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  let model

  if (anthropicKey) {
    const anthropic = createAnthropic({ apiKey: anthropicKey })
    model = anthropic('claude-haiku-4-5')
  } else if (openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey })
    model = openai('gpt-4-turbo-preview')
  } else {
    return new Response('No AI provider configured', { status: 500 })
  }

  // Stream the interview conversation
  const result = streamText({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...convertToModelMessages(messages),
    ],
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse()
}
