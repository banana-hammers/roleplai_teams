/**
 * MCP Server Types
 *
 * Model Context Protocol server configurations for connecting
 * RoleplAI roles to external systems (databases, APIs, browsers).
 */

export type McpServerType = 'stdio' | 'sse' | 'http'

/**
 * Standard I/O MCP server (spawns a child process)
 */
export interface McpServerStdio {
  type: 'stdio'
  command: string
  args?: string[]
  env?: Record<string, string>
}

/**
 * Server-Sent Events MCP server
 */
export interface McpServerSSE {
  type: 'sse'
  url: string
  headers?: Record<string, string>
}

/**
 * HTTP MCP server
 */
export interface McpServerHTTP {
  type: 'http'
  url: string
  headers?: Record<string, string>
}

/**
 * Union type for all MCP server configurations
 */
export type McpServerConfig = McpServerStdio | McpServerSSE | McpServerHTTP

/**
 * Database record for MCP server configuration
 */
export interface McpServer {
  id: string
  user_id: string
  role_id: string | null  // null = user-level (applies to all roles)
  name: string
  server_type: McpServerType
  config: McpServerConfig
  is_enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * Type guard for stdio MCP server
 */
export function isStdioServer(config: McpServerConfig): config is McpServerStdio {
  return config.type === 'stdio'
}

/**
 * Type guard for SSE MCP server
 */
export function isSseServer(config: McpServerConfig): config is McpServerSSE {
  return config.type === 'sse'
}

/**
 * Type guard for HTTP MCP server
 */
export function isHttpServer(config: McpServerConfig): config is McpServerHTTP {
  return config.type === 'http'
}
