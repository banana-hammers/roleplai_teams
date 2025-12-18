import { createClient } from '@/lib/supabase/server'
import type { McpServerConfig, McpServer } from '@/types/mcp'
import { BUILT_IN_MCP_SERVERS, isStdioServer } from '@/types/mcp'

/**
 * Resolve MCP servers for a user/role combination
 *
 * Priority:
 * 1. Role-specific servers (role_id matches)
 * 2. User-level servers (role_id is null)
 * 3. Built-in servers (if explicitly enabled)
 */
export async function resolveMcpServers(
  userId: string,
  roleId: string
): Promise<Record<string, McpServerConfig>> {
  const supabase = await createClient()

  // Fetch user-level and role-level MCP servers
  const { data: servers } = await supabase
    .from('mcp_servers')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true)
    .or(`role_id.is.null,role_id.eq.${roleId}`)
    .order('role_id', { ascending: true, nullsFirst: true })

  if (!servers || servers.length === 0) {
    return {}
  }

  // Build configuration object for SDK
  // Role-specific servers override user-level servers with same name
  const mcpConfig: Record<string, McpServerConfig> = {}

  for (const server of servers as McpServer[]) {
    mcpConfig[server.name] = server.config
  }

  // Resolve environment variable placeholders
  for (const [name, config] of Object.entries(mcpConfig)) {
    mcpConfig[name] = await resolveConfigVariables(config, userId, roleId)
  }

  return mcpConfig
}

/**
 * Resolve ${VAR_NAME} placeholders in MCP config
 *
 * Sources:
 * 1. User secrets table (future)
 * 2. Built-in variables (WORKSPACE_PATH, etc.)
 * 3. Environment variables (fallback)
 */
async function resolveConfigVariables(
  config: McpServerConfig,
  userId: string,
  roleId: string
): Promise<McpServerConfig> {
  // Deep clone to avoid mutation
  const resolved = JSON.parse(JSON.stringify(config)) as McpServerConfig

  // Built-in variables
  const builtInVars: Record<string, string> = {
    WORKSPACE_PATH: `/workspaces/${userId}/${roleId}`,
    USER_ID: userId,
    ROLE_ID: roleId,
  }

  // Resolve env variables for stdio servers
  if (isStdioServer(resolved) && resolved.env) {
    resolved.env = await resolveEnvObject(resolved.env, builtInVars, userId)
  }

  // Resolve headers for SSE/HTTP servers
  if ('headers' in resolved && resolved.headers) {
    resolved.headers = await resolveEnvObject(resolved.headers, builtInVars, userId)
  }

  return resolved
}

/**
 * Resolve ${VAR_NAME} placeholders in an object
 */
async function resolveEnvObject(
  obj: Record<string, string>,
  builtInVars: Record<string, string>,
  userId: string
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {}

  // TODO: Fetch user secrets from database
  // const userSecrets = await fetchUserSecrets(userId)

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== 'string') {
      resolved[key] = String(value)
      continue
    }

    // Check for ${VAR_NAME} pattern
    const varMatch = value.match(/^\$\{(\w+)\}$/)
    if (varMatch) {
      const varName = varMatch[1]

      // Priority: built-in > user secrets > environment
      if (builtInVars[varName]) {
        resolved[key] = builtInVars[varName]
      } else if (process.env[varName]) {
        resolved[key] = process.env[varName]!
      } else {
        // Variable not found - leave empty to avoid exposing placeholder
        resolved[key] = ''
        console.warn(`MCP config variable ${varName} not found`)
      }
    } else {
      resolved[key] = value
    }
  }

  return resolved
}

/**
 * Get available built-in MCP servers
 */
export function getBuiltInMcpServers(): Record<string, McpServerConfig> {
  return { ...BUILT_IN_MCP_SERVERS }
}

/**
 * Enable a built-in MCP server for a user/role
 */
export async function enableBuiltInMcpServer(
  userId: string,
  serverName: string,
  roleId?: string
): Promise<boolean> {
  const builtIn = BUILT_IN_MCP_SERVERS[serverName]
  if (!builtIn) {
    return false
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('mcp_servers')
    .upsert({
      user_id: userId,
      role_id: roleId || null,
      name: serverName,
      server_type: builtIn.type,
      config: builtIn,
      is_enabled: true,
    }, {
      onConflict: 'user_id,name,role_id'
    })

  return !error
}

/**
 * Disable an MCP server for a user/role
 */
export async function disableMcpServer(
  userId: string,
  serverName: string,
  roleId?: string
): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase
    .from('mcp_servers')
    .update({ is_enabled: false })
    .eq('user_id', userId)
    .eq('name', serverName)

  if (roleId) {
    query = query.eq('role_id', roleId)
  } else {
    query = query.is('role_id', null)
  }

  const { error } = await query

  return !error
}

/**
 * Create a custom MCP server configuration
 */
export async function createCustomMcpServer(
  userId: string,
  name: string,
  config: McpServerConfig,
  roleId?: string
): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mcp_servers')
    .insert({
      user_id: userId,
      role_id: roleId || null,
      name,
      server_type: config.type,
      config,
      is_enabled: true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create MCP server:', error)
    return null
  }

  return data.id
}

/**
 * List MCP servers for a user
 */
export async function listMcpServers(
  userId: string,
  roleId?: string
): Promise<McpServer[]> {
  const supabase = await createClient()

  let query = supabase
    .from('mcp_servers')
    .select('*')
    .eq('user_id', userId)

  if (roleId) {
    query = query.or(`role_id.is.null,role_id.eq.${roleId}`)
  }

  const { data } = await query.order('name')

  return (data as McpServer[]) || []
}
