import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages } from 'ai'
import {
  buildForgeSkillPrompt,
  buildForgeSkillEditPrompt,
} from '@/lib/prompts/system-prompt-builder'
import type { ForgeSkillContext, ExistingSkillContext, SkillInterviewMode } from '@/types/skill-creation'
import { getSystemModel, errorResponse, DEFAULT_TEMPERATURE } from '@/lib/ai/create-system-model'
import { rateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit'

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
    return errorResponse('Unauthorized', 401)
  }

  const rateLimitResult = await rateLimit(
    `skills-interview:${user.id}`,
    RATE_LIMITS.default.limit,
    RATE_LIMITS.default.windowMs
  )
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
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
      .eq('is_enabled', true)

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

  const modelResult = getSystemModel()
  if ('error' in modelResult) return modelResult.error

  // Stream the interview conversation
  const result = streamText({
    model: modelResult.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...await convertToModelMessages(messages),
    ],
    temperature: DEFAULT_TEMPERATURE,
  })

  return result.toUIMessageStreamResponse()
}
