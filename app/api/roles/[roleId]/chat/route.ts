import { createClient } from '@/lib/supabase/server'
import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'

export const runtime = 'edge'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params
    const { messages } = await req.json()

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Fetch the role and verify ownership
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !role) {
      return new Response('Role not found', { status: 404 })
    }

    // Fetch user's identity core
    const { data: identityCore } = await supabase
      .from('identity_cores')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    // Fetch context packs linked to this role
    const { data: contextPacks } = await supabase
      .from('role_context_packs')
      .select(`
        context_pack_id,
        context_packs (
          name,
          content,
          type
        )
      `)
      .eq('role_id', roleId)

    // Build the system prompt with identity + role + context
    const systemPromptParts = []

    // Add identity core if available
    if (identityCore) {
      systemPromptParts.push(`# Your Identity Core
Voice: ${identityCore.voice}

Priorities:
${JSON.stringify(identityCore.priorities, null, 2)}

Boundaries:
${JSON.stringify(identityCore.boundaries, null, 2)}

Decision Rules:
${JSON.stringify(identityCore.decision_rules, null, 2)}
`)
    }

    // Add role instructions
    systemPromptParts.push(`# Role: ${role.name}
${role.description || ''}

## Instructions
${role.instructions}

## Identity Facets
${JSON.stringify(role.identity_facets, null, 2)}

## Allowed Tools
${JSON.stringify(role.allowed_tools, null, 2)}

## Approval Policy
${role.approval_policy}
`)

    // Add context packs
    if (contextPacks && contextPacks.length > 0) {
      systemPromptParts.push('# Context Packs')
      contextPacks.forEach((cp: any) => {
        const pack = cp.context_packs
        systemPromptParts.push(`\n## ${pack.name} (${pack.type})
${pack.content}`)
      })
    }

    const systemPrompt = systemPromptParts.join('\n\n---\n\n')

    // Fetch user's API key for the preferred provider
    const provider = role.model_preference?.split('/')[0] || 'anthropic'
    const modelName = role.model_preference?.split('/')[1]

    const { data: apiKeys } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .maybeSingle()

    let apiKey: string | undefined

    // TODO: Decrypt the API key
    if (apiKeys?.encrypted_key) {
      // apiKey = await decryptApiKey(apiKeys.encrypted_key)
    }

    // Fall back to system keys
    if (!apiKey) {
      apiKey = provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : process.env.ANTHROPIC_API_KEY
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'No API key available. Please add your own API key in settings.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize AI provider
    let aiProvider
    if (provider === 'openai') {
      const openai = createOpenAI({ apiKey })
      aiProvider = openai(modelName || 'gpt-4-turbo-preview')
    } else {
      const anthropic = createAnthropic({ apiKey })
      aiProvider = anthropic(modelName || 'claude-3-5-sonnet-20241022')
    }

    // Inject system prompt as first message
    const enhancedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages
    ]

    // Stream the response
    const result = streamText({
      model: aiProvider,
      messages: enhancedMessages,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Role chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
