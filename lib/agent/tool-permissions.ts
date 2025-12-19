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
 * SECURITY: Tools that can cause damage and should never run with bypassPermissions
 */
export const DANGEROUS_TOOLS = ['Bash', 'Write', 'Edit', 'Task'] as const

/**
 * Safe Bash command prefixes (read-only or limited scope)
 */
export const SAFE_BASH_PREFIXES = [
  'echo ',
  'cat ',
  'head ',
  'tail ',
  'ls ',
  'pwd',
  'which ',
  'type ',
  'git status',
  'git log',
  'git diff',
  'git branch',
  'npm list',
  'npm outdated',
  'node --version',
  'npm --version',
] as const

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
 * SECURITY: Validate that tool/permission combinations are safe
 * Returns an error if dangerous tools are combined with bypassPermissions
 */
export function validateToolPermissionCombination(
  allowedTools: string[],
  approvalPolicy: ApprovalPolicy
): { valid: boolean; error?: string; safePolicyOverride?: ApprovalPolicy } {
  const hasDangerousTools = allowedTools.some(t =>
    DANGEROUS_TOOLS.includes(t as typeof DANGEROUS_TOOLS[number])
  )

  if (hasDangerousTools && approvalPolicy === 'never') {
    return {
      valid: false,
      error: `Cannot use approval_policy='never' with dangerous tools: ${
        allowedTools.filter(t => DANGEROUS_TOOLS.includes(t as typeof DANGEROUS_TOOLS[number])).join(', ')
      }. Use 'smart' or 'always' instead.`,
      safePolicyOverride: 'smart' // Suggest a safer alternative
    }
  }

  return { valid: true }
}

/**
 * Map RoleplAI approval policy to SDK permission mode
 * SECURITY: Automatically upgrades to safer mode if dangerous tools are present
 */
export function mapApprovalPolicy(
  policy: ApprovalPolicy,
  allowedTools?: string[]
): 'default' | 'acceptEdits' | 'bypassPermissions' {
  // SECURITY: If dangerous tools are present and policy is 'never', force 'smart'
  if (allowedTools && policy === 'never') {
    const hasDangerousTools = allowedTools.some(t =>
      DANGEROUS_TOOLS.includes(t as typeof DANGEROUS_TOOLS[number])
    )
    if (hasDangerousTools) {
      console.warn(
        'SECURITY: Overriding bypassPermissions due to dangerous tools:',
        allowedTools.filter(t => DANGEROUS_TOOLS.includes(t as typeof DANGEROUS_TOOLS[number]))
      )
      return 'acceptEdits' // Force safer mode
    }
  }

  switch (policy) {
    case 'always':
      // Require approval for everything
      return 'default'
    case 'never':
      // No approval needed (only if no dangerous tools)
      return 'bypassPermissions'
    case 'smart':
      // Auto-accept safe edits, prompt for dangerous ops
      return 'acceptEdits'
    default:
      return 'default'
  }
}

/**
 * Normalize a string for pattern matching (collapse whitespace, trim)
 */
function normalizeForMatching(str: string): string {
  return str.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * Check if a tool is in the disallowed list (supports patterns)
 * SECURITY: Improved pattern matching with normalization and regex support
 */
export function isToolDisallowed(
  toolName: string,
  toolInput: Record<string, unknown>,
  role: Role
): { disallowed: boolean; reason?: string } {
  const config = (role.tool_config as ToolConfig) || {}
  const disallowedPatterns = config.disallowedTools || []

  // Normalize the input for matching
  const inputStr = JSON.stringify(toolInput)
  const normalizedInput = normalizeForMatching(inputStr)

  for (const pattern of disallowedPatterns) {
    // Support regex patterns prefixed with "regex:"
    if (pattern.startsWith('regex:')) {
      try {
        const regexPattern = pattern.slice(6)
        const regex = new RegExp(regexPattern, 'i')
        if (regex.test(inputStr) || regex.test(normalizedInput)) {
          return {
            disallowed: true,
            reason: `Operation matched blocked pattern: ${regexPattern}`
          }
        }
      } catch {
        console.error(`Invalid regex pattern: ${pattern}`)
      }
      continue
    }

    const [tool, ...argPatterns] = pattern.split(':')

    // Check tool name match
    if (tool !== toolName && tool !== '*') continue

    // If no argument patterns, tool is fully disallowed
    if (argPatterns.length === 0) {
      return { disallowed: true, reason: `Tool ${toolName} is not allowed for this role` }
    }

    // Check argument patterns with normalization (e.g., "Bash:rm -rf" blocks rm -rf commands)
    const argPattern = argPatterns.join(':')
    const normalizedPattern = normalizeForMatching(argPattern)

    // Check both original and normalized strings
    if (inputStr.includes(argPattern) || normalizedInput.includes(normalizedPattern)) {
      return {
        disallowed: true,
        reason: `Operation "${argPattern}" is not allowed for this role`
      }
    }
  }

  return { disallowed: false }
}

/**
 * SECURITY: Check if a Bash command is in the safe list
 */
export function isSafeBashCommand(command: string): boolean {
  const normalizedCommand = normalizeForMatching(command)
  return SAFE_BASH_PREFIXES.some(prefix =>
    normalizedCommand.startsWith(prefix.toLowerCase())
  )
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
