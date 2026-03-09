import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getSystemModel, errorResponse } from '@/lib/ai/create-system-model'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'edge'

const loreExtractionSchema = z.object({
  companyName: z.string().describe('The company or organization name'),
  entries: z.array(z.object({
    name: z.string().describe('Short title for this lore entry'),
    content: z.string().describe('The full content of this lore entry'),
    type: z.enum(['bio', 'brand', 'rules', 'custom']).describe('The type of lore entry'),
  })).describe('Array of extracted lore entries'),
})

/**
 * Extract structured Lore entries from Loremaster interview messages
 * POST /api/onboarding/extract-lore
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const rateLimitResult = await rateLimit(
    `onboarding-extract-lore:${user.id}`,
    RATE_LIMITS.default.limit,
    RATE_LIMITS.default.windowMs
  )
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  const { messages } = await req.json()

  const modelResult = getSystemModel()
  if ('error' in modelResult) return modelResult.error

  const extractionPrompt = `Analyze this conversation between the Loremaster (AI interviewer) and the user about their company/organization.
Extract structured Lore entries from their responses.

Types of entries to extract:
- "brand": Company overview, mission, values, culture, positioning
- "bio": Founder bios, key team members, their roles and backgrounds
- "rules": Business model, operational rules, processes, policies
- "custom": Anything else notable that doesn't fit the above categories

Guidelines:
- Extract the company name
- Create separate entries for distinct topics (don't lump everything together)
- Each entry should have a clear, descriptive name (e.g., "Company Overview", "Founder - Jane Smith", "Revenue Model")
- Content should be comprehensive but concise — capture the key facts
- Only extract information the user actually provided — don't invent details
- If the user mentioned founders, create individual bio entries for each
- If the user mentioned values or culture, create a brand entry
- If the user mentioned business model or rules, create rules entries

Conversation to analyze:
${JSON.stringify(messages, null, 2)}

Extract all relevant lore entries from this conversation.`

  try {
    const result = await generateObject({
      model: modelResult.model,
      schema: loreExtractionSchema,
      prompt: extractionPrompt,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error('Error extracting lore:', error)
    return NextResponse.json(
      { error: 'Failed to extract lore entries' },
      { status: 500 }
    )
  }
}
