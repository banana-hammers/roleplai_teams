import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import {
  buildForgeSkillPrompt,
  buildForgeSkillEditPrompt,
} from '@/lib/prompts/system-prompt-builder'
import type { ForgeSkillContext, ExistingSkillContext, SkillInterviewMode } from '@/types/skill-creation'

export const runtime = 'edge'

/**
 * Skill Interview Endpoint with Forge
 * POST /api/skills/interview
 *
 * Forge interviews users to design or refine a skill.
 * Supports create mode (new skill) and edit mode (modify existing).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Messages come from useChat in UI format, other params come from transport body
  const body = await req.json()
  const messages = body.messages // UIMessage format from useChat
  const mode: SkillInterviewMode = body.mode || 'create'
  const roleId: string = body.roleId
  const existingSkill: ExistingSkillContext | undefined = body.existingSkill

  // Fetch role info for context
  let roleName: string | undefined
  let availableTools: string[] = []

  if (roleId) {
    // Get role name
    const { data: role } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .eq('user_id', user.id)
      .single()

    roleName = role?.name

    // Get MCP servers for this role to show available tools
    const { data: mcpServers } = await supabase
      .from('mcp_servers')
      .select('name')
      .eq('role_id', roleId)
      .eq('enabled', true)

    if (mcpServers && mcpServers.length > 0) {
      // Note: We just show server names, actual tools are fetched at runtime
      availableTools = mcpServers.map((s) => `mcp_${s.name}_*`)
    }
  }

  // Build context for Forge
  const context: ForgeSkillContext = {
    mode: mode || 'create',
    roleId,
    roleName,
    existingSkill,
    availableTools,
  }

  // Build appropriate system prompt based on mode
  const systemPrompt =
    mode === 'edit' && existingSkill
      ? buildForgeSkillEditPrompt(context)
      : buildForgeSkillPrompt(context)

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

  // Stream the interview conversation
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
