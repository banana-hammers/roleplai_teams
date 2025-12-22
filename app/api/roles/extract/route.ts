import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ROLE_EXTRACTION_PROMPT } from '@/lib/constants/role-prompts'
import { extractionResultSchema, type ExtractionResult } from '@/types/role-creation'

// JSON Schema for tool_use - mirrors extractionResultSchema
const EXTRACTION_TOOL_SCHEMA: Anthropic.Tool = {
  name: 'extract_role',
  description: 'Extract a structured role configuration and starter skills from an interview transcript',
  input_schema: {
    type: 'object' as const,
    properties: {
      role: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Catchy role name, max 100 chars' },
          description: { type: 'string', description: '1-2 sentences describing the role, max 500 chars' },
          instructions: { type: 'string', description: '2-4 paragraphs covering purpose, behaviors, and edge cases' },
          identity_facets: {
            type: 'object',
            properties: {
              tone_adjustment: { type: 'string', description: 'How this role modifies communication style' },
              priority_override: { type: 'array', items: { type: 'string' }, description: 'Elevated priorities for this role' },
              special_behaviors: { type: 'array', items: { type: 'string' }, description: 'Role-specific behaviors' },
            },
          },
          approval_policy: { type: 'string', enum: ['always', 'never', 'smart'], description: 'When to require user approval' },
        },
        required: ['name', 'description', 'instructions', 'identity_facets', 'approval_policy'],
      },
      skills: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Action name, max 100 chars' },
            description: { type: 'string', description: 'What the skill does, max 500 chars' },
            prompt_template: { type: 'string', description: 'Prompt with {{placeholders}} for inputs' },
            input_schema: {
              type: 'object',
              properties: {
                type: { type: 'string', const: 'object' },
                properties: { type: 'object', additionalProperties: { type: 'object' } },
                required: { type: 'array', items: { type: 'string' } },
              },
              required: ['type', 'properties'],
            },
            examples: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  expected_output: { type: 'string' },
                },
                required: ['input', 'expected_output'],
              },
            },
          },
          required: ['name', 'description', 'prompt_template', 'input_schema'],
        },
      },
    },
    required: ['role', 'skills'],
  },
}

// Node.js runtime required for Anthropic SDK compatibility on Vercel
export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for complex extractions

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
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      tools: [EXTRACTION_TOOL_SCHEMA],
      tool_choice: { type: 'tool', name: 'extract_role' },
      messages: [
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
    })

    // Extract tool use result from response
    const toolUseBlock = response.content.find(block => block.type === 'tool_use')
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      console.error('No tool_use block in response:', response.content)
      return NextResponse.json({ error: 'Failed to extract role configuration' }, { status: 500 })
    }

    // Validate with Zod schema (tool_use already returns structured JSON)
    const extracted: ExtractionResult = extractionResultSchema.parse(toolUseBlock.input)

    return NextResponse.json(extracted)
  } catch (error) {
    console.error('Extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract role configuration' },
      { status: 500 }
    )
  }
}
