/**
 * Built-in Tools Registry
 * Defines and executes built-in tools for the chat endpoint
 * Edge-compatible (no Node.js dependencies)
 *
 * Note: web_search now uses Anthropic's native server tool (web_search_20250305)
 * which is handled by Anthropic's servers. No API key required.
 * Pricing: $10 per 1,000 searches + standard token costs
 */

import type Anthropic from '@anthropic-ai/sdk'
import { executeWebFetch, formatFetchResult } from './web-fetch'

const BUILTIN_TOOL_NAMES = ['web_search', 'web_fetch'] as const
type BuiltinToolName = (typeof BUILTIN_TOOL_NAMES)[number]

/**
 * Check if a tool name is a built-in tool
 */
export function isBuiltinTool(name: string): name is BuiltinToolName {
  return BUILTIN_TOOL_NAMES.includes(name as BuiltinToolName)
}

/**
 * Check if a tool name is a server-side tool (handled by Anthropic)
 * Server tools don't require us to execute them - the API handles it
 */
export function isServerTool(name: string): boolean {
  return name === 'web_search'
}

/**
 * Get Anthropic's native web search tool definition
 * This is a server-side tool - Anthropic handles the search execution
 */
export function getWebSearchTool(): Anthropic.WebSearchTool20250305 {
  return {
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 10, // Limit searches per request
  }
}

/**
 * Get custom tool definitions (tools we execute ourselves)
 */
export function getCustomToolDefinitions(): Anthropic.Tool[] {
  return [
    {
      name: 'web_fetch',
      description:
        'Fetch and read the content of a web page. Use this when you need to read the full content of a specific URL, such as an article, documentation page, or any web resource.',
      input_schema: {
        type: 'object' as const,
        properties: {
          url: {
            type: 'string',
            description: 'The URL to fetch (must be http or https)',
          },
        },
        required: ['url'],
      },
    },
  ]
}

/**
 * Execute a built-in tool (only for custom tools, not server tools)
 * Server tools like web_search are handled automatically by the API
 */
export async function executeBuiltinTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'web_fetch': {
      const url = input.url as string
      const result = await executeWebFetch(url)
      return formatFetchResult(result)
    }

    case 'web_search':
      // This should never be called - web_search is a server tool
      return 'Error: web_search is a server tool and should not be executed manually'

    default:
      return `Unknown built-in tool: ${name}`
  }
}

/**
 * Get all available built-in tools
 * Returns a mixed array of server tools (WebSearchTool20250305) and custom tools (Tool)
 */
export function getAvailableBuiltinTools(): Anthropic.ToolUnion[] {
  return [
    getWebSearchTool(), // Native Anthropic server tool
    ...getCustomToolDefinitions(), // Custom tools we execute ourselves
  ]
}

export type { GenericToolDefinition } from './types'
import type { GenericToolDefinition } from './types'

/**
 * Get built-in tool definitions in provider-agnostic format.
 * OpenAI doesn't support Anthropic's server tools (web_search), so we skip those.
 */
export function getBuiltinToolsForProvider(provider: 'anthropic' | 'openai'): GenericToolDefinition[] {
  const tools: GenericToolDefinition[] = [
    {
      name: 'web_fetch',
      description:
        'Fetch and read the content of a web page. Use this when you need to read the full content of a specific URL, such as an article, documentation page, or any web resource.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to fetch (must be http or https)',
          },
        },
        required: ['url'],
      },
    },
  ]

  // web_search is Anthropic-only (native server tool)
  // OpenAI models don't get web_search

  return tools
}
