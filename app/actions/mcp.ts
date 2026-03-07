'use server'

import { requireAuth, verifyRoleOwnership } from '@/lib/supabase/auth-helpers'
import { testMcpConnection as testConnection } from '@/lib/mcp/client'
import { validateMcpUrl } from '@/lib/mcp/url-validation'
import type { McpServerSSE } from '@/types/mcp'

/**
 * Create a new MCP server for a role
 */
export async function createMcpServer(
  roleId: string,
  data: {
    name: string
    url: string
    headers?: Record<string, string>
  }
): Promise<{ success: boolean; serverId?: string; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  // Validate URL (format + SSRF protection)
  const urlValidation = validateMcpUrl(data.url)
  if (!urlValidation.valid) {
    return { success: false, error: urlValidation.error }
  }

  // Validate role ownership
  if (!await verifyRoleOwnership(supabase, roleId, user.id)) {
    return { success: false, error: 'Role not found' }
  }

  const config: McpServerSSE = {
    type: 'sse',
    url: data.url,
    headers: data.headers,
  }

  const { data: server, error } = await supabase
    .from('mcp_servers')
    .insert({
      user_id: user.id,
      role_id: roleId,
      name: data.name,
      server_type: 'sse',
      config,
      is_enabled: true,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A server with this name already exists' }
    }
    return { success: false, error: error.message }
  }

  return { success: true, serverId: server.id }
}

/**
 * Delete an MCP server
 */
export async function deleteMcpServer(
  serverId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  const { error } = await supabase
    .from('mcp_servers')
    .delete()
    .eq('id', serverId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Toggle MCP server enabled state
 */
export async function toggleMcpServer(
  serverId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  const { error } = await supabase
    .from('mcp_servers')
    .update({ is_enabled: enabled })
    .eq('id', serverId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Test connection to an MCP server
 * Returns available tools if successful
 */
export async function testMcpServerConnection(
  url: string,
  headers?: Record<string, string>
): Promise<{
  success: boolean
  tools?: Array<{ name: string; description?: string }>
  serverInfo?: { name: string; version: string }
  error?: string
}> {
  // Validate URL (format + SSRF protection)
  const urlValidation = validateMcpUrl(url)
  if (!urlValidation.valid) {
    return { success: false, error: urlValidation.error }
  }

  const result = await testConnection(url, headers)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return {
    success: true,
    tools: result.tools.map(t => ({
      name: t.name,
      description: t.description,
    })),
    serverInfo: result.serverInfo,
  }
}

