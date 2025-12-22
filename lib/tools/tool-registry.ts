/**
 * Client-side Tool Registry
 * Provides metadata and formatting for tool results in the UI
 */

export interface ToolMetadata {
  displayName: string
  description: string
  icon: 'Search' | 'Globe' | 'Wrench' | 'Plug'
  category: 'builtin' | 'skill' | 'mcp'
}

/**
 * Registry of built-in tools with display metadata
 */
export const TOOL_REGISTRY: Record<string, ToolMetadata> = {
  web_search: {
    displayName: 'Web Search',
    description: 'Searches the web for current information using Brave or Serper API',
    icon: 'Search',
    category: 'builtin'
  },
  web_fetch: {
    displayName: 'Web Fetch',
    description: 'Fetches and reads the content of a web page URL',
    icon: 'Globe',
    category: 'builtin'
  }
}

/**
 * Get metadata for a tool by name
 * Falls back to generic metadata for unknown tools (skills, MCP tools)
 */
export function getToolMetadata(name: string): ToolMetadata {
  // Check registry for known tools
  if (TOOL_REGISTRY[name]) {
    return TOOL_REGISTRY[name]
  }

  // Handle MCP tools (prefixed with mcp_serverName_toolName)
  if (name.startsWith('mcp_')) {
    const parts = name.split('_')
    const serverName = parts[1] || 'External'
    const toolName = parts.slice(2).join('_') || name
    return {
      displayName: toolName.replace(/_/g, ' '),
      description: `External tool from MCP server: ${serverName}`,
      icon: 'Plug',
      category: 'mcp'
    }
  }

  // Default for skills and unknown tools
  return {
    displayName: name.replace(/_/g, ' '),
    description: 'Custom skill',
    icon: 'Wrench',
    category: 'skill'
  }
}

/**
 * Format tool input for display in the UI
 * Returns a human-readable summary of the input parameters
 */
export function formatToolInput(name: string, input?: Record<string, unknown>): string {
  if (!input) return ''

  switch (name) {
    case 'web_search': {
      const query = input.query as string
      if (query) {
        return `Query: "${query}"`
      }
      return ''
    }

    case 'web_fetch': {
      const url = input.url as string
      if (url) {
        // Truncate long URLs
        try {
          const urlObj = new URL(url)
          const displayUrl = urlObj.hostname + (urlObj.pathname.length > 30
            ? urlObj.pathname.slice(0, 30) + '...'
            : urlObj.pathname)
          return `URL: ${displayUrl}`
        } catch {
          return `URL: ${url.slice(0, 50)}${url.length > 50 ? '...' : ''}`
        }
      }
      return ''
    }

    default: {
      // For other tools, show first key-value pair
      const entries = Object.entries(input)
      if (entries.length === 0) return ''

      const [key, value] = entries[0]
      const valueStr = typeof value === 'string'
        ? value.slice(0, 50) + (value.length > 50 ? '...' : '')
        : JSON.stringify(value).slice(0, 50)
      return `${key}: ${valueStr}`
    }
  }
}
