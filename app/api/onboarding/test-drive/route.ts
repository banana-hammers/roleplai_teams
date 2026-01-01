import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import type { IdentityCore } from '@/lib/onboarding/generate-identity'

export const runtime = 'edge'

/**
 * Build system prompt from identity core
 */
function buildTestDrivePrompt(identity: IdentityCore): string {
  // Priorities are now an ordered array
  const rankedPriorities = identity.priorities || []

  const activeBoundaries = Object.entries(identity.boundaries)
    .filter(([key, value]) => key !== 'custom' && value === true)
    .map(([name]) => name.replace(/_/g, ' '))

  const customBoundaries = identity.boundaries.custom as string[] | undefined

  // Build priority instructions based on rank
  const priorityInstructions = rankedPriorities.map((p, i) => {
    const rank = i === 0 ? 'PRIMARY' : i === 1 ? 'SECONDARY' : 'TERTIARY'
    const instructions: Record<string, string> = {
      accuracy: 'Always prioritize getting facts right. Cite sources when possible.',
      efficiency: 'Be concise and efficient. Value user\'s time.',
      empathy: 'Show understanding and consideration for feelings.',
      creativity: 'Think creatively and use metaphors when helpful.',
      logic: 'Use clear reasoning and build arguments step by step.',
      growth: 'Encourage learning and improvement.',
      clarity: 'Make complex things simple to understand.',
      thoroughness: 'Be comprehensive and cover all bases.',
      brevity: 'Say only what needs to be said, nothing more.',
      curiosity: 'Explore topics deeply and ask good questions.',
      patience: 'Take time and give things proper attention.',
      directness: 'Get straight to the point without hedging.',
    }
    return `- ${rank}: ${instructions[p] || p}`
  }).join('\n')

  return `You are a test version of the user's AI identity. Respond authentically to their personality.

**Voice**: ${identity.voice}

**Ranked Priorities**:
${priorityInstructions}

**Boundaries**: ${activeBoundaries.join(', ')}${customBoundaries ? `, ${customBoundaries.join(', ')}` : ''}
${identity.boundaries.no_speculation ? '- Never guess or make up information. Say "I don\'t know" when uncertain.' : ''}
${identity.boundaries.admit_uncertainty ? '- Always admit when you\'re not certain about something.' : ''}
${identity.boundaries.no_assumptions ? '- Ask for clarification instead of assuming what the user means.' : ''}
${identity.boundaries.cite_sources ? '- Reference sources when providing factual information.' : ''}

Embody this personality in your responses. Be authentic and consistent.`
}

/**
 * Test Drive Chat Endpoint
 * POST /api/onboarding/test-drive
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages, identity } = await req.json()

  if (!identity) {
    return new Response('Identity core required', { status: 400 })
  }

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

  const systemPrompt = buildTestDrivePrompt(identity)

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
