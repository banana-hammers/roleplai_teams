import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { FORGE_INTERVIEW_PROMPT } from '@/lib/constants/role-prompts'

export const runtime = 'edge'

/**
 * AI Role Interview Endpoint with Forge
 * POST /api/roles/interview
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages } = await req.json()

  // Use Anthropic as primary, OpenAI as fallback
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  let model

  if (anthropicKey) {
    const anthropic = createAnthropic({ apiKey: anthropicKey })
    model = anthropic('claude-sonnet-4-5-20250929')
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
      { role: 'system', content: FORGE_INTERVIEW_PROMPT },
      ...convertToModelMessages(messages),
    ],
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse()
}
