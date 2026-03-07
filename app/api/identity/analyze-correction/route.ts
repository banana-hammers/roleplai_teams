import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getSystemModel, errorResponse } from '@/lib/ai/create-system-model'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'edge'

const correctionSchema = z.object({
  field_updates: z.record(z.string(), z.unknown()),
  explanation: z.string(),
})

/**
 * Analyze a user correction and map it to identity field updates
 * POST /api/identity/analyze-correction
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const rateLimitResult = await rateLimit(
    `identity-correction:${user.id}`,
    RATE_LIMITS.default.limit,
    RATE_LIMITS.default.windowMs
  )
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  const { correction, message_content, current_style_profile, current_cognitive_style } = await req.json()

  if (!correction || typeof correction !== 'string') {
    return errorResponse('Correction text is required')
  }

  const modelResult = getSystemModel()
  if ('error' in modelResult) return modelResult.error
  const model = modelResult.model

  const prompt = `A user is providing feedback about how their AI responded. Map their correction to specific identity profile field updates.

User's correction: "${correction}"

AI message they're correcting:
${message_content ? `"${message_content}"` : '(not provided)'}

Current style profile: ${JSON.stringify(current_style_profile || {})}
Current cognitive style: ${JSON.stringify(current_cognitive_style || {})}

Available fields to update:

Style profile fields:
- sentence_length: "short" | "medium" | "long" | "varied"
- vocabulary_level: "simple" | "moderate" | "advanced" | "technical"
- formality: "casual" | "balanced" | "formal" | "professional"
- punctuation_habits: string[] (e.g., ["uses ellipsis", "exclamation marks"])
- formatting_prefs: string[] (e.g., ["bullet points", "short paragraphs"])
- signature_phrases: string[] (recurring phrases)
- tone_markers: string[] (e.g., ["enthusiastic", "measured"])

Cognitive style fields:
- decision_approach: "intuitive" | "analytical" | "collaborative" | "decisive"
- uncertainty_response: "explore" | "research" | "ask_others" | "make_best_guess"
- explanation_preference: "big_picture_first" | "details_first" | "examples_first" | "analogies"
- feedback_style: "direct" | "sandwich" | "questions" | "supportive"
- context_need: "minimal" | "moderate" | "comprehensive"

Return only the fields that should change based on the correction. Include a brief explanation of why these changes were made.`

  try {
    const result = await generateObject({
      model,
      schema: correctionSchema,
      prompt,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error('Error analyzing correction:', error)
    return NextResponse.json(
      { error: 'Failed to analyze correction' },
      { status: 500 }
    )
  }
}
