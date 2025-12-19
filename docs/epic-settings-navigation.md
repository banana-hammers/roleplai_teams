# Epic: Settings & Navigation - Configuration UI

## Summary

Complete settings infrastructure enabling users to configure API keys, tool permissions, and role-specific settings through a unified UI.

## Status: ✅ Complete

**Completed**: December 2025

---

## Motivation

Users need a way to configure:
- **User-level settings**: API keys, default preferences
- **Role-level settings**: Tool permissions, approval policies, model selection
- **Navigation**: Easy access to settings from anywhere in the app

---

## User Stories

### As a user, I want to...
- Add my own Anthropic/OpenAI API keys to use with my roles
- Set default model and approval policy for new roles
- Manage my profile information

### As a role creator, I want to...
- Configure which tools my role can use (web_search, web_fetch)
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
│  │            │Preferences│ │  │  └────────────────────────┘ │
│  └────────────────────────┘ │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
                 │                              │
                 ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                 │
│  ┌──────────┐  ┌─────────────┐  ┌──────┐  ┌───────────────┐   │
│  │ profiles │  │user_api_keys│  │roles │  │ role_skills   │   │
│  └──────────┘  └─────────────┘  └──────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Settings Page (`app/(authenticated)/settings/page.tsx`)

Server component that fetches user data and renders the settings tabs:

```typescript
export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile, API keys
  const { data: profile } = await supabase.from('profiles').select('*')...
  const { data: apiKeys } = await supabase.from('user_api_keys').select('id, provider, label, created_at')...

  return <SettingsTabs profile={profile} apiKeys={apiKeys} />
}
```

#### 2. Settings Tabs (`components/settings/settings-tabs.tsx`)

Client component with tabs:

| Tab | Component | Features |
|-----|-----------|----------|
| Profile | `profile-settings.tsx` | Edit full name |
| API Keys | `api-keys-settings.tsx` | Add/delete provider keys (encrypted) |
| Preferences | `preferences-settings.tsx` | Default model & approval policy |

#### 3. Role Settings Page (`app/(authenticated)/roles/[roleId]/settings/page.tsx`)

Per-role configuration with 3 tabs:

| Tab | Features |
|-----|----------|
| General | Name, description, instructions, model, approval policy |
| Tools & Permissions | Toggle web tools (web_search, web_fetch) |
| Skills | View assigned skills |

#### 4. Tool Config Selector (`components/settings/tool-config-selector.tsx`)

Visual tool permission editor for web tools:

```typescript
const WEB_TOOLS = [
  { name: 'web_search', displayName: 'Web Search', risk: 'moderate' },
  { name: 'web_fetch', displayName: 'Web Fetch', risk: 'moderate' }
]
```

Each tool shows:
- Icon and name
- Risk level badge (moderate)
- Description
- Toggle switch

---

## Available Tools

| Tool | Description | Risk Level |
|------|-------------|------------|
| `web_search` | Search the web via Brave/Serper API | Moderate |
| `web_fetch` | Fetch and extract content from URLs | Moderate |

**Note**: File operations (Read, Write, Edit, Bash) and MCP servers are not available on Vercel Edge runtime.

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
| `components/settings/preferences-settings.tsx` | Default preferences |
| `components/settings/role-settings-form.tsx` | Role settings tabs |
| `components/settings/tool-config-selector.tsx` | Web tool permission editor |

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
  /roles/[roleId]/settings          ← Role settings
/settings                           ← User settings
```

### Navigation Entry Points

1. **Navbar**: `Dashboard | Settings | + Create Role | [User Menu]`
2. **Role Chat Header**: `← Back | Role Name | ⚙️ Settings`
3. **User Menu Dropdown**: Links to Settings (existing)

---

## Database Dependencies

| Table | Used For |
|-------|----------|
| `profiles` | User profile data |
| `user_api_keys` | BYO API key storage (AES-256-GCM encrypted) |
| `roles` | Role settings (tool_config, approval_policy) |
| `role_skills` | Assigned skills per role |
| `skills` | Available skill definitions |

---

## Security

- **API Keys**: Encrypted with AES-256-GCM using PBKDF2 key derivation
- **Rate Limiting**: 30 requests/minute per user
- **RLS**: All tables enforce user isolation via Row-Level Security

---

## Future Enhancements

### Phase 2: Advanced Configuration
- [ ] API key encryption UI (show encrypted status)
- [ ] Per-role tool restrictions

### Phase 3: Analytics & Monitoring
- [ ] Tool usage analytics dashboard
- [ ] Cost tracking per role/user
- [ ] Task execution logs viewer

---

## Related Epics

- [epic-chat-tools-skills.md](./epic-chat-tools-skills.md) - Web tools integration
- [epic-role-creation.md](./epic-role-creation.md) - Role creation wizard
- [epic-account-creation.md](./epic-account-creation.md) - User onboarding
- [epic-security-hardening.md](./epic-security-hardening.md) - Security features

---

## Success Metrics

- Users can add/manage API keys through UI
- Role tool permissions are configurable (web tools)
- Settings are accessible from navbar and role chat
- All forms save successfully to database
