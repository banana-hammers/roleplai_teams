# Epic: Settings & Navigation - Agent SDK Configuration UI

## Summary

Complete settings infrastructure enabling users to configure API keys, MCP servers, tool permissions, and role-specific settings through a unified UI. This Epic builds on the Claude Agent SDK integration by providing the frontend for all agent configuration options.

## Motivation

The Claude Agent SDK integration (see `epic-chat-tools-skills.md`) added powerful capabilities:
- Built-in tools (Read, Write, Edit, Bash, Glob, Grep)
- Web tools (WebSearch, WebFetch)
- MCP server connections (GitHub, Postgres, Playwright)
- Approval workflows (always/smart/never)
- Session persistence

However, users had no way to configure these capabilities. This Epic provides:
- **User-level settings**: API keys, default preferences, MCP servers
- **Role-level settings**: Tool permissions, approval policies, model selection
- **Navigation**: Easy access to settings from anywhere in the app

---

## User Stories

### As a user, I want to...
- Add my own Anthropic/OpenAI API keys to use with my roles
- Enable/disable MCP servers (GitHub, Postgres, Playwright, etc.)
- Set default model and approval policy for new roles
- Manage my profile information

### As a role creator, I want to...
- Configure which tools my role can use (Read, Write, Bash, WebSearch)
- Set the approval policy for tool executions
- Choose the AI model for my role
- Edit role instructions and identity facets
- Access role settings directly from the chat interface

---

## Technical Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Navigation                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────┐  │
│  │ Dashboard │  │ Settings │  │ Role Chat (⚙️ settings btn) │  │
│  └──────────┘  └──────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                 │                              │
                 ▼                              ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│    /settings (User-level)   │  │ /roles/[id]/settings (Role) │
│  ┌────────────────────────┐ │  │  ┌────────────────────────┐ │
│  │ Profile    │ API Keys  │ │  │  │ General │ Tools│Skills│ │
│  │ MCP Servers│Preferences│ │  │  └────────────────────────┘ │
│  └────────────────────────┘ │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
                 │                              │
                 ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                 │
│  ┌──────────┐  ┌─────────────┐  ┌──────┐  ┌─────────────────┐  │
│  │ profiles │  │user_api_keys│  │roles │  │   mcp_servers   │  │
│  └──────────┘  └─────────────┘  └──────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Settings Page (`app/(authenticated)/settings/page.tsx`)

Server component that fetches user data and renders the settings tabs:

```typescript
export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile, API keys, MCP servers
  const { data: profile } = await supabase.from('profiles').select('*')...
  const { data: apiKeys } = await supabase.from('user_api_keys').select('id, provider, label, created_at')...
  const { data: mcpServers } = await supabase.from('mcp_servers').select('*').is('role_id', null)...

  return <SettingsTabs profile={profile} apiKeys={apiKeys} mcpServers={mcpServers} />
}
```

#### 2. Settings Tabs (`components/settings/settings-tabs.tsx`)

Client component with 4 tabs:

| Tab | Component | Features |
|-----|-----------|----------|
| Profile | `profile-settings.tsx` | Edit full name |
| API Keys | `api-keys-settings.tsx` | Add/delete provider keys |
| MCP Servers | `mcp-servers-settings.tsx` | Toggle 6 built-in servers |
| Preferences | `preferences-settings.tsx` | Default model & approval policy |

#### 3. Role Settings Page (`app/(authenticated)/roles/[roleId]/settings/page.tsx`)

Per-role configuration with 3 tabs:

| Tab | Features |
|-----|----------|
| General | Name, description, instructions, model, approval policy |
| Tools & Permissions | Toggle built-in tools and web tools |
| Skills | View assigned skills |

#### 4. Tool Config Selector (`components/settings/tool-config-selector.tsx`)

Visual tool permission editor:

```typescript
const BUILT_IN_TOOLS = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'Task']
const WEB_TOOLS = ['WebSearch', 'WebFetch']

const RISK_LEVELS = {
  Read: 'safe', Glob: 'safe', Grep: 'safe',
  Write: 'moderate', Edit: 'moderate',
  Bash: 'dangerous', WebSearch: 'moderate', WebFetch: 'moderate'
}
```

Each tool shows:
- Icon and name
- Risk level badge (safe/moderate/dangerous)
- Description
- Toggle switch

#### 5. MCP Servers Settings (`components/settings/mcp-servers-settings.tsx`)

Toggle built-in MCP servers:

| Server | Description |
|--------|-------------|
| playwright | Browser automation |
| filesystem | File operations |
| github | GitHub API |
| postgres | Database queries |
| fetch | HTTP requests |
| memory | Persistent memory |

---

## Files Created

### Pages
| File | Purpose |
|------|---------|
| `app/(authenticated)/settings/page.tsx` | Main settings page (server component) |
| `app/(authenticated)/roles/[roleId]/settings/page.tsx` | Role-specific settings |

### Components
| File | Purpose |
|------|---------|
| `components/settings/settings-tabs.tsx` | Tab container for user settings |
| `components/settings/profile-settings.tsx` | Profile editor |
| `components/settings/api-keys-settings.tsx` | API key management |
| `components/settings/mcp-servers-settings.tsx` | MCP server toggles |
| `components/settings/preferences-settings.tsx` | Default preferences |
| `components/settings/role-settings-form.tsx` | Role settings tabs |
| `components/settings/tool-config-selector.tsx` | Tool permission editor |

### UI Components Added
| File | Purpose |
|------|---------|
| `components/ui/switch.tsx` | Toggle switch (shadcn/ui) |

## Files Modified

| File | Changes |
|------|---------|
| `components/navigation/navbar-client.tsx` | Added Settings link with icon |
| `app/(authenticated)/roles/[roleId]/page.tsx` | Added settings gear button in header |

---

## Navigation Structure

```
/                                    ← Landing (public)
/login, /signup, /auth              ← Auth (public)
/roles                              ← Dashboard (authenticated)
  /roles/create                     ← Role creation wizard
  /roles/[roleId]                   ← Role chat (⚙️ → settings)
  /roles/[roleId]/settings          ← Role settings (NEW)
/settings                           ← User settings (NEW)
```

### Navigation Entry Points

1. **Navbar**: `Dashboard | Settings | + Create Role | [User Menu]`
2. **Role Chat Header**: `← Back | Role Name | ⚙️ Settings`
3. **User Menu Dropdown**: Links to Settings (existing)

---

## Database Dependencies

This Epic uses existing tables from the Agent SDK migration:

| Table | Used For |
|-------|----------|
| `profiles` | User profile data |
| `user_api_keys` | BYO API key storage |
| `mcp_servers` | MCP server configurations |
| `roles` | Role settings (tool_config, approval_policy) |
| `role_skills` | Assigned skills per role |
| `skills` | Available skill definitions |

---

## Future Enhancements

### Phase 2: Advanced Configuration
- [ ] Custom MCP server creation (stdio/sse/http)
- [ ] Environment variable/secret management for MCP servers
- [ ] API key encryption UI (show encrypted status)
- [ ] Per-role MCP server overrides

### Phase 3: Analytics & Monitoring
- [ ] Tool usage analytics dashboard
- [ ] Cost tracking per role/user
- [ ] Approval request history
- [ ] Task execution logs viewer

### Phase 4: Advanced Permissions
- [ ] Granular tool argument restrictions (e.g., `Bash:rm -rf` blocklist)
- [ ] Time-based approval policies
- [ ] Role permission templates
- [ ] Team/organization settings

---

## Related Epics

- [epic-chat-tools-skills.md](./epic-chat-tools-skills.md) - Agent SDK backend integration
- [epic-role-creation.md](./epic-role-creation.md) - Role creation wizard
- [epic-account-creation.md](./epic-account-creation.md) - User onboarding

---

## Success Metrics

- Users can add/manage API keys through UI
- MCP servers can be toggled on/off
- Role tool permissions are configurable
- Settings are accessible from navbar and role chat
- All forms save successfully to database
