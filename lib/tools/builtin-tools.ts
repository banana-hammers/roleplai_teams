/**
 * Built-in Tools Registry
 * Defines and executes built-in tools for the chat endpoint
 * Edge-compatible (no Node.js dependencies)
 */

import type Anthropic from '@anthropic-ai/sdk'
import { executeWebSearch, formatSearchResults } from './web-search'
import { executeWebFetch, formatFetchResult } from './web-fetch'

/**
 * Built-in tool names
 */
export const BUILTIN_TOOL_NAMES = ['web_search', 'web_fetch'] as const
export type BuiltinToolName = typeof BUILTIN_TOOL_NAMES[number]

/**
 * Check if a tool name is a built-in tool
 */
export function isBuiltinTool(name: string): name is BuiltinToolName {
  return BUILTIN_TOOL_NAMES.includes(name as BuiltinToolName)
}

/**
 * Get Anthropic tool definitions for built-in tools
 */
export function getBuiltinToolDefinitions(): Anthropic.Tool[] {
  return [
    {
      name: 'web_search',
      description: 'Search the web for information. Use this when you need to find current information, research topics, or look up facts that may not be in your training data.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results to return (default: 5, max: 10)'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'web_fetch',
      description: 'Fetch and read the content of a web page. Use this when you need to read the full content of a specific URL, such as an article, documentation page, or any web resource.',
      input_schema: {
        type: 'object' as const,
        properties: {
          url: {
            type: 'string',
            description: 'The URL to fetch (must be http or https)'
          }
        },
        required: ['url']
      }
    }
  ]
}

/**
 * Execute a built-in tool
 */
export async function executeBuiltinTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'web_search': {
      const query = input.query as string
      const maxResults = Math.min(input.max_results as number || 5, 10)
      const result = await executeWebSearch(query, maxResults)
      return formatSearchResults(result)
    }

    case 'web_fetch': {
      const url = input.url as string
      const result = await executeWebFetch(url)
      return formatFetchResult(result)
    }

    default:
      return `Unknown built-in tool: ${name}`
  }
}

/**
 * Check if web tools are available (API keys configured)
 */
export function areWebToolsAvailable(): boolean {
  return !!(process.env.BRAVE_API_KEY || process.env.SERPER_API_KEY)
}

/**
 * Get available built-in tools based on configuration
 */
export function getAvailableBuiltinTools(): Anthropic.Tool[] {
  const tools: Anthropic.Tool[] = []

  // Web search requires API key
  if (process.env.BRAVE_API_KEY || process.env.SERPER_API_KEY) {
    const searchTool = getBuiltinToolDefinitions().find(t => t.name === 'web_search')
    if (searchTool) tools.push(searchTool)
  }

  // Web fetch is always available (just uses fetch)
  const fetchTool = getBuiltinToolDefinitions().find(t => t.name === 'web_fetch')
  if (fetchTool) tools.push(fetchTool)

  return tools
}
