import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ROLE_EXTRACTION_PROMPT } from '@/lib/constants/role-prompts'
import { extractionResultSchema, type ExtractionResult } from '@/types/role-creation'

export const runtime = 'edge'

/**
 * Role + Skills Extraction Endpoint
 * POST /api/roles/extract
 *
 * Takes interview messages and extracts structured role config + skills
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages } = await req.json()

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'No interview messages provided' }, { status: 400 })
  }

  // Get user's identity core for context
  const { data: identityCore } = await supabase
    .from('identity_cores')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Format interview transcript
  const transcript = messages
    .map((m: { role: string; content: string }) => {
      const speaker = m.role === 'user' ? 'User' : 'Forge'
      return `${speaker}: ${m.content}`
    })
    .join('\n\n')

  // Format identity core context
  let identityCoreContext = 'No identity core set up yet.'
  if (identityCore) {
    identityCoreContext = `Voice: ${identityCore.voice}
Priorities: ${JSON.stringify(identityCore.priorities)}
Boundaries: ${JSON.stringify(identityCore.boundaries)}
Decision Rules: ${JSON.stringify(identityCore.decision_rules)}`
  }

  // Build the extraction prompt
  const extractionPrompt = ROLE_EXTRACTION_PROMPT
    .replace('{{transcript}}', transcript)
    .replace('{{identity_core}}', identityCoreContext)

  // Get API key
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No AI provider configured' }, { status: 500 })
  }

  try {
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16384, // High limit for complex skill extractions with examples
      messages: [
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
    })

    // Check if response was truncated
    if (response.stop_reason === 'max_tokens') {
      console.error('Extraction response was truncated due to max_tokens limit')
      return NextResponse.json(
        { error: 'Response was too long. Please try a simpler role description.' },
        { status: 500 }
      )
    }

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No text response from AI' }, { status: 500 })
    }

    // Parse JSON from response
    let extracted: ExtractionResult
    try {
      // Try to extract JSON from the response (it might have markdown code blocks)
      let jsonText = textContent.text.trim()

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7)
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3)
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3)
      }
      jsonText = jsonText.trim()

      const parsed = JSON.parse(jsonText)

      // Validate with Zod schema
      extracted = extractionResultSchema.parse(parsed)
    } catch (parseError) {
      console.error('Failed to parse extraction response:', parseError)
      console.error('Raw response:', textContent.text)
      return NextResponse.json(
        { error: 'Failed to parse role configuration. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(extracted)
  } catch (error) {
    console.error('Extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract role configuration' },
      { status: 500 }
    )
  }
}
