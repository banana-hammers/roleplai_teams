/**
 * MCP Server Types
 *
 * Model Context Protocol server configurations for connecting
 * RoleplAI roles to external systems (databases, APIs, browsers).
 */

/**
 * Server-Sent Events MCP server
 */
export interface McpServerSSE {
  type: 'sse'
  url: string
  headers?: Record<string, string>
}

/**
 * Union type for all MCP server configurations
 */
export type McpServerConfig = McpServerSSE

/**
 * Database record for MCP server configuration
 */
export interface McpServer {
  id: string
  user_id: string
  role_id: string | null  // null = user-level (applies to all roles)
  name: string
  config: McpServerConfig
  is_enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * Type guard for SSE MCP server
 */
export function isSseServer(config: McpServerConfig): config is McpServerSSE {
  return config.type === 'sse'
}
