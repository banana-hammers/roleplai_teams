/**
 * MCP SSE Client
 *
 * Edge-compatible client for MCP servers using SSE/HTTP transport.
 * Uses native fetch API - no external dependencies.
 */

import type {
  McpJsonRpcRequest,
  McpJsonRpcResponse,
  McpToolsListResult,
  McpToolCallResult,
  McpTool,
  McpInitializeResult,
} from './types'
import { McpConnectionError, McpJsonRpcError, McpToolExecutionError } from './errors'

const MCP_PROTOCOL_VERSION = '2024-11-05'
const REQUEST_TIMEOUT_MS = 30000

/**
 * Generate a unique request ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Build JSON-RPC request object
 */
function buildJsonRpcRequest(method: string, params?: Record<string, unknown>): McpJsonRpcRequest {
  return {
    jsonrpc: '2.0',
    id: generateId(),
    method,
    params,
  }
}

/**
 * Parse SSE stream and extract JSON-RPC response
 * Handles both streaming SSE and direct JSON responses
 */
async function parseResponse<T>(response: Response): Promise<McpJsonRpcResponse<T>> {
  const contentType = response.headers.get('content-type') || ''

  // Direct JSON response
  if (contentType.includes('application/json')) {
    const json = await response.json()
    return json as McpJsonRpcResponse<T>
  }

  // SSE response - parse events
  if (contentType.includes('text/event-stream')) {
    const text = await response.text()
    const lines = text.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data) {
          try {
            return JSON.parse(data) as McpJsonRpcResponse<T>
          } catch {
            // Continue to next line
          }
        }
      }
    }

    throw new Error('No valid JSON-RPC response in SSE stream')
  }

  // Fallback: try to parse as JSON anyway
  const text = await response.text()
  try {
    return JSON.parse(text) as McpJsonRpcResponse<T>
  } catch {
    throw new Error(`Unexpected response format: ${contentType}`)
  }
}

/**
 * Send a JSON-RPC request to an MCP server
 */
async function sendRequest<T>(
  url: string,
  method: string,
  params?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<T> {
  const request = buildJsonRpcRequest(method, params)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        ...headers,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const jsonRpcResponse = await parseResponse<T>(response)

    if (jsonRpcResponse.error) {
      throw new McpJsonRpcError(
        jsonRpcResponse.error.code,
        jsonRpcResponse.error.message,
        jsonRpcResponse.error.data
      )
    }

    if (jsonRpcResponse.result === undefined) {
      throw new Error('No result in JSON-RPC response')
    }

    return jsonRpcResponse.result
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof McpJsonRpcError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out')
      }
      throw error
    }

    throw new Error('Unknown error during request')
  }
}

/**
 * Initialize a session with an MCP server
 * Returns server capabilities and info
 */
export async function initializeMcpSession(
  serverName: string,
  url: string,
  headers?: Record<string, string>
): Promise<McpInitializeResult> {
  try {
    const result = await sendRequest<McpInitializeResult>(
      url,
      'initialize',
      {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: {
          name: 'RoleplayAI Teams',
          version: '1.0.0',
        },
      },
      headers
    )

    // Send initialized notification (no response expected, but good practice)
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      })
    } catch {
      // Notification failure is not critical
    }

    return result
  } catch (error) {
    throw new McpConnectionError(
      serverName,
      url,
      error instanceof Error ? error.message : 'Failed to initialize session',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * List available tools from an MCP server
 */
export async function listMcpTools(
  serverName: string,
  url: string,
  headers?: Record<string, string>
): Promise<McpTool[]> {
  try {
    // First initialize the session
    await initializeMcpSession(serverName, url, headers)

    // Then list tools
    const result = await sendRequest<McpToolsListResult>(
      url,
      'tools/list',
      {},
      headers
    )

    return result.tools || []
  } catch (error) {
    if (error instanceof McpConnectionError) {
      throw error
    }

    throw new McpConnectionError(
      serverName,
      url,
      error instanceof Error ? error.message : 'Failed to list tools',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Call a tool on an MCP server
 */
export async function callMcpTool(
  serverName: string,
  url: string,
  toolName: string,
  input: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<string> {
  try {
    const result = await sendRequest<McpToolCallResult>(
      url,
      'tools/call',
      {
        name: toolName,
        arguments: input,
      },
      headers
    )

    // Extract text content from result
    const textContent = result.content
      .filter(c => c.type === 'text' && c.text)
      .map(c => c.text)
      .join('\n')

    if (result.isError) {
      return `Error: ${textContent || 'Tool execution failed'}`
    }

    return textContent || JSON.stringify(result.content)
  } catch (error) {
    if (error instanceof McpJsonRpcError) {
      throw new McpToolExecutionError(
        serverName,
        toolName,
        error.message,
        error
      )
    }

    throw new McpToolExecutionError(
      serverName,
      toolName,
      error instanceof Error ? error.message : 'Tool call failed',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Test connection to an MCP server
 * Returns available tools if successful
 */
export async function testMcpConnection(
  url: string,
  headers?: Record<string, string>
): Promise<{ success: true; tools: McpTool[]; serverInfo: McpInitializeResult['serverInfo'] } | { success: false; error: string }> {
  try {
    const initResult = await sendRequest<McpInitializeResult>(
      url,
      'initialize',
      {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: {
          name: 'RoleplayAI Teams',
          version: '1.0.0',
        },
      },
      headers
    )

    // Send initialized notification
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      })
    } catch {
      // Not critical
    }

    const toolsResult = await sendRequest<McpToolsListResult>(
      url,
      'tools/list',
      {},
      headers
    )

    return {
      success: true,
      tools: toolsResult.tools || [],
      serverInfo: initResult.serverInfo,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
  }
}
