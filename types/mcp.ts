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
 * Built-in MCP servers available by default
 */
export const BUILT_IN_MCP_SERVERS: Record<string, McpServerConfig> = {
  playwright: {
    type: 'stdio',
    command: 'npx',
    args: ['@playwright/mcp@latest'],
  },
  filesystem: {
    type: 'stdio',
    command: 'npx',
    args: ['@anthropic-ai/mcp-server-filesystem'],
    env: {
      ALLOWED_PATHS: '${WORKSPACE_PATH}',
    },
  },
  github: {
    type: 'stdio',
    command: 'npx',
    args: ['@anthropic-ai/mcp-server-github'],
    env: {
      GITHUB_TOKEN: '${GITHUB_TOKEN}',
    },
  },
  postgres: {
    type: 'stdio',
    command: 'npx',
    args: ['@anthropic-ai/mcp-server-postgres'],
    env: {
      DATABASE_URL: '${DATABASE_URL}',
    },
  },
  fetch: {
    type: 'stdio',
    command: 'npx',
    args: ['@anthropic-ai/mcp-server-fetch'],
  },
  memory: {
    type: 'stdio',
    command: 'npx',
    args: ['@anthropic-ai/mcp-server-memory'],
  },
}

/**
 * Get description for a built-in MCP server
 */
export function getMcpServerDescription(name: string): string {
  const descriptions: Record<string, string> = {
    playwright: 'Browser automation - navigate, click, type, screenshot',
    filesystem: 'File operations - read, write, list directories',
    github: 'GitHub API - repos, issues, PRs, actions',
    postgres: 'PostgreSQL database queries',
    fetch: 'HTTP requests to external APIs',
    memory: 'Persistent memory across sessions',
  }
  return descriptions[name] || name
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
