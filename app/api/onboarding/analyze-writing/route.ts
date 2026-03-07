import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getSystemModel, errorResponse } from '@/lib/ai/create-system-model'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'edge'

const styleSchema = z.object({
  sentence_length: z.enum(['short', 'medium', 'long', 'varied']).optional(),
  vocabulary_level: z.enum(['simple', 'moderate', 'advanced', 'technical']).optional(),
  formality: z.enum(['casual', 'balanced', 'formal', 'professional']).optional(),
  punctuation_habits: z.array(z.string()).optional(),
  formatting_prefs: z.array(z.string()).optional(),
  signature_phrases: z.array(z.string()).optional(),
  tone_markers: z.array(z.string()).optional(),
})

/**
 * Analyze writing samples to extract style profile
 * POST /api/onboarding/analyze-writing
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const rateLimitResult = await rateLimit(
    `onboarding-writing:${user.id}`,
    RATE_LIMITS.default.limit,
    RATE_LIMITS.default.windowMs
  )
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  const { samples } = await req.json()

  if (!Array.isArray(samples) || samples.length === 0) {
    return errorResponse('At least one writing sample is required')
  }

  const modelResult = getSystemModel()
  if ('error' in modelResult) return modelResult.error
  const model = modelResult.model

  const prompt = `Analyze the writing style of these samples. Focus on HOW the person writes, not what they're writing about.

Writing samples:
${samples.map((s: string, i: number) => `--- Sample ${i + 1} ---\n${s}`).join('\n\n')}

Extract their writing style profile:
- sentence_length: Are their sentences short, medium, long, or varied?
- vocabulary_level: Is their vocabulary simple, moderate, advanced, or technical?
- formality: Is their writing casual, balanced, formal, or professional?
- punctuation_habits: Notable punctuation patterns (e.g., "uses ellipsis...", "exclamation marks!", "em dashes", "no periods")
- formatting_prefs: Formatting tendencies (e.g., "uses bullet points", "writes in paragraphs", "short fragments")
- signature_phrases: Recurring phrases or expressions they use (e.g., "honestly", "I think", "basically")
- tone_markers: Emotional indicators in their writing (e.g., "enthusiastic", "measured", "self-deprecating", "matter-of-fact")`

  try {
    const result = await generateObject({
      model,
      schema: styleSchema,
      prompt,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error('Error analyzing writing:', error)
    return NextResponse.json(
      { error: 'Failed to analyze writing samples' },
      { status: 500 }
    )
  }
}
