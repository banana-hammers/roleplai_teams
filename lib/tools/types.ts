/**
 * Unified provider-agnostic tool definition (JSON Schema based)
 * Used by built-in tools, MCP tools, and skills.
 */
export interface GenericToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}
