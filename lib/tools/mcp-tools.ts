/**
 * MCP Tools Integration
 *
 * Fetches tools from MCP servers and integrates them with the chat endpoint.
 */

import type Anthropic from '@anthropic-ai/sdk'
import type { McpServer } from '@/types/mcp'
import type { McpToolServerMapping } from '@/lib/mcp/types'
import { McpErrorInfo, toMcpErrorInfo, formatMcpErrorForAI } from '@/lib/mcp/errors'
import { listMcpTools, callMcpTool } from '@/lib/mcp/client'
import { isSseServer } from '@/types/mcp'

/**
 * Sanitize a tool name for use with Anthropic API
 * Anthropic requires: ^[a-zA-Z0-9_-]{1,64}$
 */
function sanitizeToolName(serverName: string, toolName: string): string {
  const prefix = `mcp_${serverName}_`
  const sanitized = `${prefix}${toolName}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 64)
  return sanitized
}

/**
 * Result of fetching MCP tools from servers
 */
export interface McpToolsResult {
  /** Anthropic-compatible tool definitions */
  tools: Anthropic.Tool[]
  /** Mapping from sanitized tool name to server info */
  toolMappings: Map<string, McpToolServerMapping>
  /** Errors encountered while fetching tools */
  errors: McpErrorInfo[]
}

/**
 * Fetch tools from all enabled SSE MCP servers
 * Returns tools in Anthropic format plus mapping info
 */
export async function getMcpToolsFromServers(
  servers: McpServer[]
): Promise<McpToolsResult> {
  const tools: Anthropic.Tool[] = []
  const toolMappings = new Map<string, McpToolServerMapping>()
  const errors: McpErrorInfo[] = []

  // Filter to only SSE servers
  const sseServers = servers.filter(s => s.is_enabled && isSseServer(s.config))

  // Fetch tools from all servers in parallel
  const results = await Promise.allSettled(
    sseServers.map(async (server) => {
      if (!isSseServer(server.config)) return { server, tools: [] }

      const mcpTools = await listMcpTools(
        server.name,
        server.config.url,
        server.config.headers
      )

      return { server, tools: mcpTools }
    })
  )

  // Process results
  for (const result of results) {
    if (result.status === 'rejected') {
      const error = result.reason instanceof Error ? result.reason : new Error('Unknown error')
      errors.push(toMcpErrorInfo(error))
      continue
    }

    const { server, tools: mcpTools } = result.value

    for (const mcpTool of mcpTools) {
      const sanitizedName = sanitizeToolName(server.name, mcpTool.name)

      // Create Anthropic tool definition
      tools.push({
        name: sanitizedName,
        description: mcpTool.description
          ? `[MCP: ${server.name}] ${mcpTool.description}`
          : `[MCP: ${server.name}] ${mcpTool.name}`,
        input_schema: {
          type: 'object' as const,
          properties: mcpTool.inputSchema.properties || {},
          required: mcpTool.inputSchema.required || [],
        },
      })

      // Store mapping for execution
      if (isSseServer(server.config)) {
        toolMappings.set(sanitizedName, {
          toolName: sanitizedName,
          originalName: mcpTool.name,
          serverName: server.name,
          serverUrl: server.config.url,
          serverHeaders: server.config.headers,
        })
      }
    }
  }

  return { tools, toolMappings, errors }
}

import type { GenericToolDefinition } from './types'

/**
 * Get MCP tools in provider-agnostic format (for OpenAI path)
 */
export function getMcpToolsGeneric(
  toolMappings: Map<string, McpToolServerMapping>,
  anthropicTools: Anthropic.Tool[]
): GenericToolDefinition[] {
  return anthropicTools.map(tool => ({
    name: tool.name,
    description: tool.description || tool.name,
    parameters: {
      type: 'object' as const,
      properties: (tool.input_schema as Record<string, unknown>).properties as Record<string, unknown> || {},
      required: (tool.input_schema as Record<string, unknown>).required as string[] | undefined,
    },
  }))
}

/**
 * Check if a tool name is an MCP tool
 */
export function isMcpTool(
  toolName: string,
  toolMappings: Map<string, McpToolServerMapping>
): boolean {
  return toolMappings.has(toolName)
}

/**
 * Execute an MCP tool
 * Returns the result as a string for the AI
 */
export async function executeMcpTool(
  toolName: string,
  input: Record<string, unknown>,
  toolMappings: Map<string, McpToolServerMapping>
): Promise<string> {
  const mapping = toolMappings.get(toolName)

  if (!mapping) {
    return `Error: Unknown MCP tool "${toolName}"`
  }

  try {
    const result = await callMcpTool(
      mapping.serverName,
      mapping.serverUrl,
      mapping.originalName,
      input,
      mapping.serverHeaders
    )

    return result
  } catch (error) {
    if (error instanceof Error) {
      return formatMcpErrorForAI(error)
    }
    return `Error executing MCP tool "${toolName}": Unknown error`
  }
}
