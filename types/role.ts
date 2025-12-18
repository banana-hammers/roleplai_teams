export type ApprovalPolicy = 'always' | 'never' | 'smart'

/**
 * Tool configuration for granular control over role capabilities
 */
export interface ToolConfig {
  builtInTools?: string[]        // ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
  webTools?: string[]            // ["WebSearch", "WebFetch"]
  mcpToolPatterns?: string[]     // ["mcp__github__*", "mcp__postgres__*"]
  disallowedTools?: string[]     // ["Write:/etc/*", "Bash:rm -rf"]
  requireApproval?: string[]     // ["Write", "Bash", "Edit"]
}

export interface Role {
  id: string
  user_id: string
  name: string
  description: string
  instructions: string
  identity_facets: Record<string, any>
  allowed_tools: string[]
  approval_policy: ApprovalPolicy
  model_preference: string | null
  tool_config: ToolConfig | null  // SDK tool permissions
  created_at: string
  updated_at: string
}

export interface RoleContextPack {
  role_id: string
  context_pack_id: string
}

export interface RoleSkill {
  role_id: string
  skill_id: string
  config_overrides: Record<string, any>
  created_at: string
}
