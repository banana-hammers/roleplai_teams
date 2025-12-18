# Epic: Chat Tools & Skills - Claude Agent SDK Integration

## Summary

Integrate the Claude Agent SDK to enable RoleplAI roles with powerful agentic capabilities: built-in tools (file operations, web search), MCP server connections (databases, APIs, browsers), task recording with audit trails, and progressive disclosure skills.

## Motivation

Currently, RoleplAI's skill system is limited to prompt-template interpolation (`{{placeholder}}` → value). The Claude Agent SDK provides:

- **Built-in Tools**: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
- **MCP Integration**: Connect to external systems (databases, GitHub, Playwright)
- **Session Persistence**: Resume conversations with full context
- **Hooks**: Intercept tool calls for task recording and approval workflows
- **Progressive Disclosure**: Load skill context only when needed

This transforms roles from simple prompt wrappers into autonomous agents.

## User Stories

### As a role creator, I want to...
- Enable my role to search the web and fetch URLs
- Connect my role to my GitHub repos via MCP
- Give my role read/write access to a sandboxed workspace
- Require approval before my role executes destructive commands
- See an audit trail of all actions my role has taken

### As a platform admin, I want to...
- Offer pre-configured MCP servers (GitHub, Postgres, Playwright)
- Control which built-in tools are available per role
- Track all tool executions in the tasks table
- Enforce security sandboxing for file operations

---

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Chat UI)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              /api/roles/[roleId]/agent (Node.js)                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Claude Agent SDK                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Built-in │  │   MCP    │  │  Hooks   │  │ Session │ │   │
│  │  │  Tools   │  │ Servers  │  │ (Tasks)  │  │  Mgmt   │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │   Supabase  │ │ MCP Servers │ │  Workspace  │
        │  (tasks,    │ │ (GitHub,    │ │  (sandboxed │
        │  sessions)  │ │  Postgres)  │ │   files)    │
        └─────────────┘ └─────────────┘ └─────────────┘
```

### Key Components

#### 1. Agent Endpoint (`app/api/roles/[roleId]/agent/route.ts`)

New endpoint using Claude Agent SDK instead of direct Anthropic API:

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const response = query({
  prompt: userMessage,
  options: {
    model: role.model_preference?.split('/')[1] || 'claude-sonnet-4-5-20250929',
    systemPrompt: composedSystemPrompt,  // identity + role + context + skills
    allowedTools: resolveAllowedTools(role),
    permissionMode: mapApprovalPolicy(role.approval_policy),
    hooks: {
      PreToolUse: [{ hooks: [taskRecordingHook] }],
      PostToolUse: [{ hooks: [taskCompletionHook] }]
    },
    mcpServers: await resolveMcpServers(user.id, roleId),
    cwd: `/workspaces/${user.id}/${roleId}`,
  }
});
```

**Note**: Requires Node.js runtime (not Edge) - SDK spawns Claude Code as child process.

#### 2. Task Recording Hooks (`lib/agent/task-recording-hooks.ts`)

Intercept all tool executions to create audit trail:

```typescript
// PreToolUse: Create task record
const { data: task } = await supabase.from('tasks').insert({
  user_id, role_id, skill_id,
  input: toolInput,
  status: 'running',
  trace: { tool_name, started_at, conversation_id }
});

// PostToolUse: Update with result
await supabase.from('tasks').update({
  status: 'completed',
  output: JSON.stringify(toolResponse),
  completed_at: new Date(),
  trace: { ...trace, duration_ms }
});
```

#### 3. MCP Server Configuration (`types/mcp.ts`)

Per-user/role MCP server connections:

```typescript
interface McpServerStdio {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;  // Resolved from user secrets
}

// Built-in options
const BUILT_IN_MCP = {
  playwright: { type: 'stdio', command: 'npx', args: ['@playwright/mcp@latest'] },
  github: { type: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-github'] },
  postgres: { type: 'stdio', command: 'npx', args: ['@modelcontextprotocol/server-postgres'] },
};
```

#### 4. Tool Permissions (`lib/agent/tool-permissions.ts`)

Granular control via `roles.tool_config`:

```typescript
interface ToolConfig {
  builtInTools?: string[];        // ["Read", "Glob", "Grep", "WebSearch"]
  webTools?: string[];            // ["WebFetch"]
  mcpToolPatterns?: string[];     // ["mcp__github__*"]
  disallowedTools?: string[];     // ["Bash:rm -rf *"]
  requireApproval?: string[];     // ["Write", "Edit"]
}
```

#### 5. Progressive Skills (`lib/skills/skill-to-markdown.ts`)

Convert database skills to SKILL.md format for progressive disclosure:

```typescript
function skillToMarkdown(skill: Skill): string {
  return `---
name: ${skill.name}
description: ${skill.description}
version: ${skill.version}
---

# ${skill.name}

${skill.description}

## Instructions

${skill.prompt_template}

## Input Parameters

${formatInputSchema(skill.input_schema)}

## Examples

${formatExamples(skill.examples)}
`;
}
```

---

## Database Changes

### New Table: `mcp_servers`

```sql
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,  -- null = user-level
  name TEXT NOT NULL,
  server_type TEXT NOT NULL CHECK (server_type IN ('stdio', 'sse', 'http')),
  config JSONB NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own MCP servers" ON mcp_servers FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_mcp_servers_user_id ON mcp_servers(user_id);
CREATE INDEX idx_mcp_servers_role_id ON mcp_servers(role_id);
```

### Alter Table: `conversations`

```sql
ALTER TABLE conversations ADD COLUMN sdk_session_id TEXT;
CREATE INDEX idx_conversations_sdk_session_id ON conversations(sdk_session_id);
```

### Alter Table: `roles`

```sql
ALTER TABLE roles ADD COLUMN tool_config JSONB DEFAULT '{}';
```

---

## Implementation Phases

### Phase 1: SDK Foundation
- [ ] Install `@anthropic-ai/claude-agent-sdk`
- [ ] Create `app/api/roles/[roleId]/agent/route.ts` endpoint
- [ ] Port identity composition from existing chat route
- [ ] Implement SSE streaming from SDK messages
- [ ] Add `sdk_session_id` migration

### Phase 2: Task Recording
- [ ] Create `lib/agent/task-recording-hooks.ts`
- [ ] Wire hooks into agent endpoint
- [ ] Integrate with existing `tasks` table
- [ ] Add approval workflow for `approval_policy: 'always'|'smart'`

### Phase 3: MCP Integration
- [ ] Create `mcp_servers` migration
- [ ] Create `types/mcp.ts`
- [ ] Create `lib/agent/mcp-resolver.ts`
- [ ] Add built-in MCP server options

### Phase 4: Tool Permissions
- [ ] Create `tool_config` migration
- [ ] Create `lib/agent/tool-permissions.ts`
- [ ] Update `types/role.ts` with `tool_config`
- [ ] Add tool permission UI (future)

### Phase 5: Progressive Skills
- [ ] Create `lib/skills/skill-to-markdown.ts`
- [ ] Implement skill inheritance resolution
- [ ] Update system prompt composition
- [ ] Test progressive disclosure

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/api/roles/[roleId]/agent/route.ts` | SDK-powered agent endpoint |
| `lib/agent/task-recording-hooks.ts` | Pre/Post tool use hooks for task audit |
| `lib/agent/tool-permissions.ts` | Resolve allowed tools per role |
| `lib/agent/mcp-resolver.ts` | Resolve MCP servers per user/role |
| `lib/skills/skill-to-markdown.ts` | Convert skills to SKILL.md format |
| `types/mcp.ts` | MCP server type definitions |
| `supabase/migrations/YYYYMMDD_add_sdk_session_id.sql` | Session tracking |
| `supabase/migrations/YYYYMMDD_add_mcp_servers.sql` | MCP configuration |
| `supabase/migrations/YYYYMMDD_add_tool_config.sql` | Tool permissions |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add `@anthropic-ai/claude-agent-sdk` |
| `types/role.ts` | Add `tool_config` field |
| `types/database.types.ts` | Regenerate after migrations |

---

## Security Considerations

1. **RLS Enforcement**: All queries use Supabase RLS for user isolation
2. **Sandbox Mode**: SDK sandbox enabled for all file operations
3. **Workspace Isolation**: `/workspaces/${user.id}/${roleId}` per role
4. **Tool Restrictions**: Configurable allowlists/blocklists per role
5. **Approval Workflow**: Sensitive operations can require user approval
6. **MCP Security**: Validate server configs, no arbitrary command injection
7. **Secret Resolution**: User secrets resolved server-side, never exposed

---

## Success Metrics

- Roles can execute built-in tools (Read, Glob, Grep, WebSearch)
- MCP servers can be configured per user/role
- All tool executions recorded in `tasks` table
- Approval workflow blocks sensitive operations when configured
- Session resume maintains full conversation context
- Skills load progressively based on relevance

---

## References

- [Claude Agent SDK Overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Agent Skills Documentation](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- [Building Agents with Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [Equipping Agents with Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
