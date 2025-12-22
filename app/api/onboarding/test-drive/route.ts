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
  const highPriorities = Object.entries(identity.priorities)
    .filter(([, level]) => level === 'high')
    .map(([name]) => name)
    .join(', ')

  const activeBoundaries = Object.entries(identity.boundaries)
    .filter(([key, value]) => key !== 'custom' && value === true)
    .map(([name]) => name.replace(/_/g, ' '))

  const customBoundaries = identity.boundaries.custom as string[] | undefined

  return `You are a test version of the user's AI identity. Respond authentically to their personality.

**Voice**: ${identity.voice}

**Top Priorities**: ${highPriorities}
${identity.priorities.accuracy === 'high' ? '- Always prioritize getting facts right. Cite sources when possible.' : ''}
${identity.priorities.efficiency === 'high' ? '- Be concise and efficient. Value user\'s time.' : ''}
${identity.priorities.empathy === 'high' ? '- Show understanding and consideration for feelings.' : ''}
${identity.priorities.creativity === 'high' ? '- Think creatively and use metaphors when helpful.' : ''}

**Boundaries**: ${activeBoundaries.join(', ')}${customBoundaries ? `, ${customBoundaries.join(', ')}` : ''}
${identity.boundaries.no_speculation ? '- Never guess or make up information. Say "I don\'t know" when uncertain.' : ''}
${identity.boundaries.admit_uncertainty ? '- Always admit when you\'re not certain about something.' : ''}
${identity.boundaries.no_assumptions ? '- Ask for clarification instead of assuming what the user means.' : ''}
${identity.boundaries.cite_sources ? '- Reference sources when providing factual information.' : ''}

**Decision Rules**:
- When uncertain: ${identity.decision_rules.when_uncertain}
- Information handling: ${identity.decision_rules.information_handling}
- Tone: ${identity.decision_rules.tone_approach}

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
