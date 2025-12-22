/**
 * MCP Error Types
 *
 * Custom error classes for MCP server operations.
 */

/**
 * Error when connecting to an MCP server fails
 */
export class McpConnectionError extends Error {
  public readonly serverName: string
  public readonly serverUrl: string
  public readonly cause?: Error

  constructor(serverName: string, serverUrl: string, message: string, cause?: Error) {
    super(message)
    this.name = 'McpConnectionError'
    this.serverName = serverName
    this.serverUrl = serverUrl
    this.cause = cause
  }
}

/**
 * Error when executing an MCP tool fails
 */
export class McpToolExecutionError extends Error {
  public readonly serverName: string
  public readonly toolName: string
  public readonly cause?: Error

  constructor(serverName: string, toolName: string, message: string, cause?: Error) {
    super(message)
    this.name = 'McpToolExecutionError'
    this.serverName = serverName
    this.toolName = toolName
    this.cause = cause
  }
}

/**
 * Error when an MCP server returns a JSON-RPC error
 */
export class McpJsonRpcError extends Error {
  public readonly code: number
  public readonly data?: unknown

  constructor(code: number, message: string, data?: unknown) {
    super(message)
    this.name = 'McpJsonRpcError'
    this.code = code
    this.data = data
  }
}

/**
 * Error info structure for client-facing errors
 */
export interface McpErrorInfo {
  serverName: string
  message: string
  type: 'connection' | 'execution' | 'protocol'
}

/**
 * Format an MCP error for the AI to understand and explain to the user
 */
export function formatMcpErrorForAI(error: Error): string {
  if (error instanceof McpConnectionError) {
    return `Error: MCP server '${error.serverName}' is unavailable. ${error.message}`
  }

  if (error instanceof McpToolExecutionError) {
    return `Error executing MCP tool '${error.toolName}' on server '${error.serverName}': ${error.message}`
  }

  if (error instanceof McpJsonRpcError) {
    return `MCP protocol error (code ${error.code}): ${error.message}`
  }

  return `MCP error: ${error.message}`
}

/**
 * Convert an error to McpErrorInfo for client display
 */
export function toMcpErrorInfo(error: Error): McpErrorInfo {
  if (error instanceof McpConnectionError) {
    return {
      serverName: error.serverName,
      message: error.message,
      type: 'connection'
    }
  }

  if (error instanceof McpToolExecutionError) {
    return {
      serverName: error.serverName,
      message: `Tool '${error.toolName}' failed: ${error.message}`,
      type: 'execution'
    }
  }

  if (error instanceof McpJsonRpcError) {
    return {
      serverName: 'unknown',
      message: `Protocol error: ${error.message}`,
      type: 'protocol'
    }
  }

  return {
    serverName: 'unknown',
    message: error.message,
    type: 'connection'
  }
}
