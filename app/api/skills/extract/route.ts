import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  forgeExtractedSkillSchema,
  type SkillExtractionRequest,
  type ForgeExtractedSkill,
} from '@/types/skill-creation'

// JSON Schema for tool_use - mirrors forgeExtractedSkillSchema
const SKILL_EXTRACTION_TOOL_SCHEMA: Anthropic.Tool = {
  name: 'extract_skill',
  description:
    'Extract a structured skill definition from an interview transcript',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'Action name, max 100 chars (e.g., "Draft Email", "Summarize Article")',
      },
      short_description: {
        type: 'string',
        description: 'Brief description for system prompt, ~50 chars',
      },
      description: {
        type: 'string',
        description: 'Full description of what the skill does, max 500 chars',
      },
      prompt_template: {
        type: 'string',
        description: 'The prompt template with {{placeholders}} for inputs',
      },
      detailed_instructions: {
        type: 'string',
        description: 'Rich guidance loaded when skill is invoked (optional)',
      },
      allowed_tools: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Tools this skill can use: web_search, web_fetch, or MCP tool names',
      },
      examples: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'Example input values as a description',
            },
            output: {
              type: 'string',
              description: 'Expected output for this input',
            },
          },
          required: ['input', 'output'],
        },
        description: 'Input/output examples to guide skill behavior',
      },
    },
    required: ['name', 'description', 'prompt_template', 'short_description'],
  },
}

// Build the extraction prompt
function buildExtractionPrompt(
  transcript: string,
  mode: 'create' | 'edit',
  existingSkillContext?: string
): string {
  const modeContext =
    mode === 'edit' && existingSkillContext
      ? `You are updating an existing skill. Here is the current definition:

${existingSkillContext}

Based on the conversation, update the skill with the requested changes. Preserve fields that weren't discussed unless they conflict with the changes.`
      : `You are creating a new skill from scratch based on the conversation.`

  return `You are extracting a structured skill definition from a conversation between a user and Forge (a skill designer AI).

${modeContext}

<interview_transcript>
${transcript}
</interview_transcript>

Based on this conversation, extract a complete skill definition. Include:
1. A clear, action-oriented name
2. A short description (~50 chars) for quick reference
3. A full description explaining what the skill does
4. A prompt template with {{placeholders}} for any inputs
5. Detailed instructions for how to execute the skill well
6. Any tools the skill should use (web_search, web_fetch, or MCP tools mentioned)
7. At least one example input/output pair

For the prompt_template:
- Use {{placeholder_name}} syntax for inputs
- Make it specific and actionable
- Include context about expected output format

For examples:
- Provide realistic input/output pairs
- Show what a successful execution looks like

Use the extract_skill tool to provide the structured output.`
}

// Node.js runtime required for Anthropic SDK compatibility on Vercel
export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for complex extractions

/**
 * Skill Extraction Endpoint
 * POST /api/skills/extract
 *
 * Takes interview messages and extracts a structured skill definition
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: SkillExtractionRequest = await req.json()
  const { messages, mode, existingSkill } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'No interview messages provided' },
      { status: 400 }
    )
  }

  // Format interview transcript
  const transcript = messages
    .map((m: { role: string; content: string }) => {
      const speaker = m.role === 'user' ? 'User' : 'Forge'
      return `${speaker}: ${m.content}`
    })
    .join('\n\n')

  // Format existing skill context for edit mode
  let existingSkillContext: string | undefined
  if (mode === 'edit' && existingSkill) {
    const parts = [
      `Name: ${existingSkill.name}`,
      `Description: ${existingSkill.description}`,
      `Prompt Template: ${existingSkill.prompt_template}`,
    ]
    if (existingSkill.short_description) {
      parts.push(`Short Description: ${existingSkill.short_description}`)
    }
    if (existingSkill.detailed_instructions) {
      parts.push(`Detailed Instructions: ${existingSkill.detailed_instructions}`)
    }
    if (existingSkill.allowed_tools && existingSkill.allowed_tools.length > 0) {
      parts.push(`Tools: ${existingSkill.allowed_tools.join(', ')}`)
    }
    existingSkillContext = parts.join('\n')
  }

  // Build the extraction prompt
  const extractionPrompt = buildExtractionPrompt(
    transcript,
    mode || 'create',
    existingSkillContext
  )

  // Get API key
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'No AI provider configured' },
      { status: 500 }
    )
  }

  try {
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      tools: [SKILL_EXTRACTION_TOOL_SCHEMA],
      tool_choice: { type: 'tool', name: 'extract_skill' },
      messages: [
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
    })

    // Extract tool use result from response
    const toolUseBlock = response.content.find(
      (block) => block.type === 'tool_use'
    )
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      console.error('No tool_use block in response:', response.content)
      return NextResponse.json(
        { error: 'Failed to extract skill definition' },
        { status: 500 }
      )
    }

    // Validate with Zod schema
    const extracted: ForgeExtractedSkill = forgeExtractedSkillSchema.parse(
      toolUseBlock.input
    )

    return NextResponse.json({ success: true, skill: extracted })
  } catch (error) {
    console.error('Extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract skill definition' },
      { status: 500 }
    )
  }
}
