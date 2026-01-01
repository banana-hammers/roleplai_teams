import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { VOICE_TYPES, PRIORITY_VALUES, BOUNDARY_TYPES } from '@/lib/constants/interview-prompts'

export const runtime = 'edge'

const personalitySchema = z.object({
  voice: z.enum(VOICE_TYPES),
  priorities: z.array(z.enum(PRIORITY_VALUES)),
  boundaries: z.array(z.enum(BOUNDARY_TYPES)),
  customBoundaries: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(100),
})

/**
 * Extract personality traits from interview messages
 * POST /api/onboarding/extract-personality
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages } = await req.json()

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
    return NextResponse.json({ error: 'No AI provider configured' }, { status: 500 })
  }

  const extractionPrompt = `Analyze this conversation between Nova (AI interviewer) and the user.
Extract the user's personality traits based on their responses.

Voice types:
- direct_concise: Gets to the point, no fluff
- direct_respectful: Clear but warm
- warm_conversational: Friendly, like a friend
- analytical_precise: Detailed, methodical
- playful_creative: Uses metaphors, creative
- calm_thoughtful: Measured, reflective
- energetic_enthusiastic: Upbeat, motivating

Priority values (select EXACTLY 3, in order of importance - first is most important):
- accuracy: Facts and correctness matter most
- creativity: Novel ideas and fresh perspectives matter
- efficiency: Speed and productivity matter
- empathy: Understanding feelings matters
- logic: Rational thinking matters
- growth: Learning and improvement matter
- clarity: Crystal clear communication matters
- thoroughness: Comprehensive coverage matters
- brevity: Concise, no unnecessary words
- curiosity: Exploring deeply matters
- patience: Taking time, never rushing
- directness: Straight to the point, no hedging

Boundaries (select all that apply):
- no_speculation: Don't make up information
- admit_uncertainty: Say "I don't know" when unsure
- respect_privacy: Don't pry or assume personal details
- no_assumptions: Ask for clarification instead of guessing
- cite_sources: Reference where information comes from
- no_jargon: Avoid technical language unless user uses it first
- no_condescension: Never talk down to people
- stay_on_topic: Stay focused without tangents

Conversation to analyze:
${JSON.stringify(messages, null, 2)}

Extract the personality profile. For priorities, return EXACTLY 3 values in order of importance (first = most important).
Return with high confidence (70-100).`

  try {
    const result = await generateObject({
      model,
      schema: personalitySchema,
      prompt: extractionPrompt,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error('Error extracting personality:', error)
    return NextResponse.json(
      { error: 'Failed to extract personality traits' },
      { status: 500 }
    )
  }
}
