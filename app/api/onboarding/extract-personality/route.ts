import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { VOICE_TYPES, PRIORITY_VALUES, BOUNDARY_TYPES } from '@/lib/constants/interview-prompts'
import { getSystemModel, errorResponse } from '@/lib/ai/create-system-model'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'edge'

const personalitySchema = z.object({
  voice: z.enum(VOICE_TYPES),
  priorities: z.array(z.enum(PRIORITY_VALUES)),
  boundaries: z.array(z.enum(BOUNDARY_TYPES)),
  customBoundaries: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(100),
  cognitive_style: z.object({
    decision_approach: z.enum(['intuitive', 'analytical', 'collaborative', 'decisive']).optional(),
    uncertainty_response: z.enum(['explore', 'research', 'ask_others', 'make_best_guess']).optional(),
    explanation_preference: z.enum(['big_picture_first', 'details_first', 'examples_first', 'analogies']).optional(),
    feedback_style: z.enum(['direct', 'sandwich', 'questions', 'supportive']).optional(),
    context_need: z.enum(['minimal', 'moderate', 'comprehensive']).optional(),
  }).optional(),
})

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
 * Extract personality traits from interview messages
 * POST /api/onboarding/extract-personality
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const rateLimitResult = await rateLimit(
    `onboarding-extract:${user.id}`,
    RATE_LIMITS.default.limit,
    RATE_LIMITS.default.windowMs
  )
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  const { messages } = await req.json()

  const modelResult = getSystemModel()
  if ('error' in modelResult) return modelResult.error
  const model = modelResult.model

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

Cognitive style dimensions to extract:
- decision_approach: How they make decisions (intuitive, analytical, collaborative, decisive)
- uncertainty_response: What they do when unsure (explore, research, ask_others, make_best_guess)
- explanation_preference: How they like things explained (big_picture_first, details_first, examples_first, analogies)
- feedback_style: How they give/receive feedback (direct, sandwich, questions, supportive)
- context_need: How much context they want (minimal, moderate, comprehensive)

Conversation to analyze:
${JSON.stringify(messages, null, 2)}

Extract the personality profile. For priorities, return EXACTLY 3 values in order of importance (first = most important).
Also extract cognitive_style based on how they describe their thinking and decision-making.
Return with high confidence (70-100).`

  // Filter to user messages only for style analysis
  const userMessages = messages.filter((m: { role: string }) => m.role === 'user')
  const stylePrompt = `Analyze HOW this person writes based on their messages. Focus on writing style, not content.

User messages to analyze:
${JSON.stringify(userMessages, null, 2)}

Extract their writing style profile:
- sentence_length: Are their sentences short, medium, long, or varied?
- vocabulary_level: Is their vocabulary simple, moderate, advanced, or technical?
- formality: Is their writing casual, balanced, formal, or professional?
- punctuation_habits: Notable punctuation patterns (e.g., "uses ellipsis...", "exclamation marks!", "em dashes", "no periods")
- formatting_prefs: Formatting tendencies (e.g., "uses bullet points", "writes in paragraphs", "short fragments")
- signature_phrases: Recurring phrases or expressions they use (e.g., "honestly", "I think", "basically")
- tone_markers: Emotional indicators in their writing (e.g., "enthusiastic", "measured", "self-deprecating", "matter-of-fact")`

  try {
    const [personalityResult, styleResult] = await Promise.all([
      generateObject({
        model,
        schema: personalitySchema,
        prompt: extractionPrompt,
      }),
      generateObject({
        model,
        schema: styleSchema,
        prompt: stylePrompt,
      }).catch((err) => {
        console.warn('Style extraction failed, continuing without it:', err)
        return null
      }),
    ])

    const result = {
      ...personalityResult.object,
      ...(styleResult ? { style_profile: styleResult.object } : {}),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error extracting personality:', error)
    return NextResponse.json(
      { error: 'Failed to extract personality traits' },
      { status: 500 }
    )
  }
}
