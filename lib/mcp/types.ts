/**
 * MCP Protocol Types
 *
 * Types for Model Context Protocol JSON-RPC communication.
 * Used by the Edge-compatible SSE client.
 */

/**
 * MCP tool definition returned by tools/list
 */
export interface McpTool {
  name: string
  description?: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
  }
}

/**
 * Result from executing an MCP tool
 */
export interface McpToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource'
    text?: string
    data?: string
    mimeType?: string
  }>
  isError?: boolean
}

/**
 * JSON-RPC 2.0 request format
 */
export interface McpJsonRpcRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: Record<string, unknown>
}

/**
 * JSON-RPC 2.0 response format
 */
export interface McpJsonRpcResponse<T = unknown> {
  jsonrpc: '2.0'
  id: string | number
  result?: T
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

/**
 * Response from tools/list method
 */
export interface McpToolsListResult {
  tools: McpTool[]
}

/**
 * Response from tools/call method
 */
export interface McpToolCallResult {
  content: Array<{
    type: 'text' | 'image' | 'resource'
    text?: string
    data?: string
    mimeType?: string
  }>
  isError?: boolean
}

/**
 * Initialize response from server
 */
export interface McpInitializeResult {
  protocolVersion: string
  capabilities: {
    tools?: Record<string, unknown>
    resources?: Record<string, unknown>
    prompts?: Record<string, unknown>
  }
  serverInfo: {
    name: string
    version: string
  }
}

/**
 * Mapping from tool name to the server that provides it
 */
export interface McpToolServerMapping {
  toolName: string
  originalName: string
  serverName: string
  serverUrl: string
  serverHeaders?: Record<string, string>
}
