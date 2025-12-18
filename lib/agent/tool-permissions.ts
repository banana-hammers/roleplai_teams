import type { Role, ApprovalPolicy } from '@/types/role'

/**
 * Tool configuration for a role
 */
export interface ToolConfig {
  builtInTools?: string[]
  webTools?: string[]
  mcpToolPatterns?: string[]
  disallowedTools?: string[]
  requireApproval?: string[]
}

/**
 * Built-in tools available from Claude Agent SDK
 */
export const BUILT_IN_TOOLS = [
  'Read',      // Read files
  'Write',     // Create new files
  'Edit',      // Modify existing files
  'Bash',      // Execute commands
  'Glob',      // Find files by pattern
  'Grep',      // Search file contents
  'Task',      // Spawn subagents
] as const

/**
 * Web tools for internet access
 */
export const WEB_TOOLS = [
  'WebSearch',  // Search the web
  'WebFetch',   // Fetch web pages
] as const

/**
 * Utility tools always available
 */
export const UTILITY_TOOLS = [
  'TodoWrite',       // Task tracking
] as const

/**
 * Default safe tools for read-only operations
 */
export const DEFAULT_SAFE_TOOLS = ['Read', 'Glob', 'Grep'] as const

/**
 * Resolve the list of allowed tools for a role
 */
export function resolveAllowedTools(role: Role): string[] {
  const config = (role.tool_config as ToolConfig) || {}
  const allowed = new Set<string>()

  // Add built-in tools (default: read-only safe tools)
  const builtIn = config.builtInTools || [...DEFAULT_SAFE_TOOLS]
  builtIn.forEach(t => allowed.add(t))

  // Add web tools if specified
  const web = config.webTools || []
  web.forEach(t => allowed.add(t))

  // Always include utility tools
  UTILITY_TOOLS.forEach(t => allowed.add(t))

  // Remove disallowed tools
  const disallowed = config.disallowedTools || []
  for (const pattern of disallowed) {
    // Support simple patterns like "Bash:rm -rf"
    const toolName = pattern.split(':')[0]
    allowed.delete(toolName)
  }

  return Array.from(allowed)
}

/**
 * Check if a specific tool requires approval based on role config
 */
export function shouldRequireApproval(
  toolName: string,
  role: Role
): boolean {
  const config = (role.tool_config as ToolConfig) || {}
  const requireApproval = config.requireApproval || []

  // Check exact match
  if (requireApproval.includes(toolName)) return true

  // Check pattern match (e.g., "mcp__*" for all MCP tools)
  return requireApproval.some(pattern => {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      return toolName.startsWith(prefix)
    }
    return false
  })
}

/**
 * Map RoleplAI approval policy to SDK permission mode
 */
export function mapApprovalPolicy(
  policy: ApprovalPolicy
): 'default' | 'acceptEdits' | 'bypassPermissions' {
  switch (policy) {
    case 'always':
      // Require approval for everything
      return 'default'
    case 'never':
      // No approval needed
      return 'bypassPermissions'
    case 'smart':
      // Auto-accept safe edits, prompt for dangerous ops
      return 'acceptEdits'
    default:
      return 'default'
  }
}

/**
 * Check if a tool is in the disallowed list (supports patterns)
 */
export function isToolDisallowed(
  toolName: string,
  toolInput: Record<string, unknown>,
  role: Role
): { disallowed: boolean; reason?: string } {
  const config = (role.tool_config as ToolConfig) || {}
  const disallowedPatterns = config.disallowedTools || []

  for (const pattern of disallowedPatterns) {
    const [tool, ...argPatterns] = pattern.split(':')

    // Check tool name match
    if (tool !== toolName && tool !== '*') continue

    // If no argument patterns, tool is fully disallowed
    if (argPatterns.length === 0) {
      return { disallowed: true, reason: `Tool ${toolName} is not allowed for this role` }
    }

    // Check argument patterns (e.g., "Bash:rm -rf" blocks rm -rf commands)
    const argPattern = argPatterns.join(':')
    const inputStr = JSON.stringify(toolInput)
    if (inputStr.includes(argPattern)) {
      return {
        disallowed: true,
        reason: `Operation "${argPattern}" is not allowed for this role`
      }
    }
  }

  return { disallowed: false }
}

/**
 * Get tool description for display
 */
export function getToolDescription(toolName: string): string {
  const descriptions: Record<string, string> = {
    Read: 'Read files from the workspace',
    Write: 'Create new files in the workspace',
    Edit: 'Modify existing files',
    Bash: 'Execute terminal commands',
    Glob: 'Find files by pattern',
    Grep: 'Search file contents',
    Task: 'Delegate to specialized subagents',
    WebSearch: 'Search the web',
    WebFetch: 'Fetch and parse web pages',
    TodoWrite: 'Track tasks and progress',
  }
  return descriptions[toolName] || toolName
}
