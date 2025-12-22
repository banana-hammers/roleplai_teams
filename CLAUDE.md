# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RoleplayAI Teams is an AI-powered identity management and chat platform that enables users to create AI agents called **RoleplAIrs** with personalized, consistent identities across different contexts. Built with Next.js 16, Supabase, and Vercel AI SDK v5, it combines identity cores, role-based agents, and reusable **Lore** (knowledge packs) to create sophisticated AI interactions.

### AI Assistant Characters
- **Nova** - AI interviewer that captures your personality during onboarding
- **Forge** - AI assistant that helps build your RoleplAIrs with starter skills

## Development Commands

```bash
# Development
npm run dev                # Start Next.js dev server (http://localhost:3000)
npm run build             # Build for production
npm run start             # Start production server
npm run lint              # Run ESLint

# Database (Supabase)
npx supabase start        # Start local Supabase (Docker required)
npx supabase db reset     # Apply all migrations from scratch
npx supabase gen types typescript --local > types/database.types.ts

# Type Checking
npx tsc --noEmit          # Check TypeScript errors
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Runtime**: Edge Runtime for all API routes (optimized for streaming)
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **AI**: Vercel AI SDK v5 with multi-provider support (OpenAI, Anthropic)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui (Radix UI)
- **Auth**: Supabase Auth with proxy-based session management

### Authentication Pattern

**IMPORTANT**: This project uses `proxy.ts` for authentication middleware, NOT the standard Next.js `middleware.ts` (which has been deleted). The proxy pattern is used for compatibility with Next.js 16's experimental features.

**Files**:
- [lib/supabase/middleware.ts](lib/supabase/middleware.ts) - Contains `updateSession()` logic
- [proxy.ts](proxy.ts) - Exports `proxy()` function and matcher config

**Public routes** (no auth required): `/`, `/login`, `/signup`, `/auth`, `/chat`

### Vercel AI SDK v5 Architecture

This project uses **AI SDK v5**, which has breaking changes from v4:

1. **Package Split**: React hooks moved from `ai/react` to `@ai-sdk/react`
   ```typescript
   import { useChat } from '@ai-sdk/react'
   import { DefaultChatTransport } from 'ai'
   ```

2. **Transport-based Design**: Must configure transport explicitly
   ```typescript
   const { messages, sendMessage, status } = useChat({
     transport: new DefaultChatTransport({
       api: '/api/chat',
       body: { provider, model }
     })
   })
   ```

3. **Message Structure**: Messages use `parts` array instead of simple `content`
   ```typescript
   message.parts.map(part => part.type === 'text' ? part.text : null)
   ```

4. **Send API**: Use `sendMessage({ text: "..." })` instead of `handleSubmit(e)`

### AI Chat Endpoints

**Two endpoints with different purposes**:

1. **[app/api/chat/route.ts](app/api/chat/route.ts)** - Basic chat for testing
   - No identity injection
   - Supports both OpenAI and Anthropic
   - Falls back to system API keys

2. **[app/api/roles/[roleId]/chat/route.ts](app/api/roles/[roleId]/chat/route.ts)** - Production role-based chat
   - Fetches user's identity core, role, lore, skills, and MCP servers
   - Composes system prompt from all sources
   - Enforces role ownership via RLS
   - **Built-in tools**: `web_search` (Brave/Serper API), `web_fetch` (URL fetching)
   - **MCP tools**: External tools from user-hosted SSE servers
   - **Prompt caching**: 90% cost savings on repeated system prompts
   - **Agentic loop**: Automatic tool execution with streaming

### Built-in Web Tools

Located in `lib/tools/`:
- **web-search.ts** - Web search using Brave Search or Serper API
- **web-fetch.ts** - Fetch and parse web page content
- **builtin-tools.ts** - Tool registry and execution

Requires environment variables:
```bash
BRAVE_API_KEY=...      # https://brave.com/search/api/
# OR
SERPER_API_KEY=...     # https://serper.dev/
```

### MCP Server Integration

Roles can connect to user-hosted MCP (Model Context Protocol) servers to access external tools:

**Transport**: SSE only (Edge runtime compatible, no subprocess spawning)
**Assignment**: Role-level (each role has its own MCP servers)

**Architecture**:
```
lib/mcp/
├── types.ts      - MCP JSON-RPC protocol types
├── client.ts     - Edge-compatible SSE client (no SDK dependency)
└── errors.ts     - Error classes and formatting

lib/tools/
└── mcp-tools.ts  - Tool registry integration
```

**How it works**:
1. At chat start, role's MCP servers are fetched from `mcp_servers` table
2. For each SSE server, we initialize and list available tools
3. MCP tools are prefixed: `mcp_{serverName}_{toolName}` to avoid conflicts
4. Tool calls are routed to the appropriate MCP server
5. Errors are returned to AI (so it can explain) AND shown to user via warning banner

**Adding MCP Servers** (UI):
1. Role Settings → MCP Servers tab
2. Add server name, URL, optional auth headers (JSON)
3. "Test Connection" button verifies and shows available tools
4. Toggle enable/disable per server

**Server Actions**: [app/actions/mcp.ts](app/actions/mcp.ts)
```typescript
createMcpServer(roleId, { name, url, headers })
deleteMcpServer(serverId)
toggleMcpServer(serverId, enabled)
testMcpServerConnection(url, headers)
```

### System Prompt Composition

For role-based chat, the system prompt is composed in this order:

1. **Identity Core** - User's base personality (voice, priorities, boundaries, decision rules)
2. **Role Definition** - Name, description, and role-specific instructions
3. **Identity Facets** - Role-specific personality adjustments
4. **Available Skills** - Functions the role can execute (from `role_skills` junction table)
5. **Approval Policy** - `always`, `never`, or `smart`
6. **Lore** - Linked knowledge snippets (bio, brand, rules, custom)

See [app/api/roles/[roleId]/chat/route.ts](app/api/roles/[roleId]/chat/route.ts) for implementation.

## Core Concepts

### Identity Core
The foundational personality shared across all of a user's AI agents:
- **voice**: Communication style (TEXT)
- **priorities**: What matters most (JSONB)
- **boundaries**: What the AI won't do (JSONB)
- **decision_rules**: How to make choices (JSONB)

One identity core per user, fetched from `identity_cores` table.

### Roles (RoleplAIrs)
Specific AI agent configurations linked to an identity core:
- **instructions**: Role-specific behavior (TEXT)
- **identity_facets**: Role-specific personality adjustments (JSONB)
- **approval_policy**: ENUM (`always`, `never`, `smart`)
- **model_preference**: Format: `provider/model` (e.g., `anthropic/claude-sonnet-4-5-20250929`)

Skills are linked via `role_skills` junction table. Many roles per user, stored in `roles` table.

### Lore
Reusable knowledge snippets that can be attached to multiple roles:
- **Type**: ENUM (`bio`, `brand`, `rules`, `custom`)
- **Content**: Markdown or plain text
- Linked to roles via `role_lore` junction table

### BYO API Keys
Users can bring their own OpenAI/Anthropic API keys:
- Stored in `user_api_keys` table
- **Fully implemented** with AES-256-GCM encryption
- Falls back to system keys from environment variables

## Database Schema

All tables use **Row-Level Security (RLS)** for multi-tenant isolation. Policies check `auth.uid() = user_id`.

**Core tables**:
- `profiles` - Extends `auth.users` with metadata
- `identity_cores` - User's base AI personality
- `roles` - AI agent configurations (RoleplAIrs)
- `lore` - Reusable knowledge snippets
- `role_lore` - Junction table linking roles to lore
- `skills` - Skill definitions with prompt templates
- `role_skills` - Junction table linking roles to skills
- `user_api_keys` - Encrypted BYO API keys
- `conversations` - Chat history with messages
- `mcp_servers` - MCP server configurations (SSE transport, role-level)

**Indexes**: All `user_id` columns are indexed.

**Schema file**: [supabase/migrations/20250101000000_initial_schema.sql](supabase/migrations/20250101000000_initial_schema.sql)

**Generating types after schema changes**:
```bash
npx supabase gen types typescript --local > types/database.types.ts
```

## Common Development Patterns

### Supabase Client Usage

**Server Components / API Routes**:
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()  // Note: awaited!
const { data: { user } } = await supabase.auth.getUser()
```

**Client Components**:
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()  // Not awaited
```

**IMPORTANT**: Server client is async, browser client is not.

### API Route Pattern

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'  // Required for streaming

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS automatically enforces user_id checks
  const { data } = await supabase.from('roles').select('*')

  return NextResponse.json({ data })
}
```

### Streaming AI Responses

```typescript
import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const result = streamText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  messages: [
    { role: 'system', content: systemPrompt },  // Identity + role + context
    ...userMessages
  ],
  temperature: 0.7,
})

return result.toTextStreamResponse()
```

### Path Aliases

Use `@/` to reference project root:
```typescript
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import type { Role } from '@/types/role'
```

## Important Implementation Details

### Deleted Files
- `middleware.ts` - DO NOT recreate. Use `proxy.ts` instead.
- `.env.local.example` - Deleted. See README.md for env var examples.
- `PHASE_2_SETUP.md` - Deleted. Phase 2 is complete.

### API Key Encryption
- **Fully implemented** using AES-256-GCM with PBKDF2 key derivation
- Encryption utility: [lib/crypto/api-key-encryption.ts](lib/crypto/api-key-encryption.ts)
- Keys encrypted on save: [app/api/user/api-keys/route.ts](app/api/user/api-keys/route.ts)
- Keys decrypted in all chat endpoints before use
- Requires `ENCRYPTION_MASTER_KEY` environment variable (min 32 chars)
- Falls back to system keys if user has no BYO keys

### Skills System

Skills are linked to roles via the `role_skills` junction table:
- Created during role creation (via Forge) or manually added
- Each skill has a `prompt_template` for execution
- Skills are fetched via junction table query in chat endpoint
- Server actions in [app/actions/roles.ts](app/actions/roles.ts) handle CRUD

**Progressive Disclosure Architecture** (3-level system):

| Level | Field | Purpose | When Loaded |
|-------|-------|---------|-------------|
| 1 | `short_description` | Brief description (~50 chars) | System prompt (always) |
| 2 | `detailed_instructions` | Rich guidance for execution | When skill is invoked |
| 2 | `examples` | Input/output examples (JSONB) | When skill is invoked |
| 3 | `linked_lore_ids` | Related lore for context | When skill is invoked |

**Agentic Skills** can call tools via `allowed_tools` array:
- Built-in tools: `web_search`, `web_fetch`
- MCP tools: `mcp_{serverName}_{toolName}`
- Nested execution with max 5 iterations

**Skill Execution**: [lib/skills/execute-skill.ts](lib/skills/execute-skill.ts)
```typescript
// Simple skill (no tools)
const result = await executeSkillSimple(skill, inputs, context)

// Agentic skill (with tools)
const result = await executeSkillWithTools(skill, inputs, context)
```

### Model Preference Format
Stored in `roles.model_preference` as `provider/model`:
- Example: `anthropic/claude-sonnet-4-5-20250929`
- Example: `openai/gpt-4-turbo-preview`
- Parsed with `split('/')` in [app/api/roles/[roleId]/chat/route.ts:105-106](app/api/roles/[roleId]/chat/route.ts#L105-L106)

### Model Tier System

Models are categorized into tiers based on cost/capability for the RPG-style UI:

| Tier | Color | Models |
|------|-------|--------|
| **Legendary** | Gold (amber-500) | claude-opus-4, gpt-4o, o1 |
| **Epic** | Purple (violet-500) | gpt-4-turbo, claude-3-opus |
| **Rare** | Blue (blue-500) | claude-sonnet-4.5, gpt-4o-mini |
| **Common** | Gray | claude-haiku, gpt-3.5-turbo |

**Implementation**: [lib/utils/model-tiers.ts](lib/utils/model-tiers.ts)
```typescript
import { getModelTier, getModelDisplayName } from '@/lib/utils/model-tiers'

const tierConfig = getModelTier(role.model_preference)  // Returns tier config with colors, icon
const modelLabel = getModelDisplayName(role.model_preference)  // "Sonnet 4.5", "GPT-4o", etc.
```

### Role Leveling (Future)

Leveling will be based on engagement and retraining:
- Users engage with RoleplAIrs through conversations
- Good/bad examples can be used to improve skills
- Personality and memories can be refined over time
- Level reflects how much the RoleplAIr has been trained

This feature is planned but not yet implemented.

### Lore Fetching
Uses nested select with junction table:
```typescript
const { data: roleLore } = await supabase
  .from('role_lore')
  .select(`
    lore_id,
    lore (
      name,
      content,
      type
    )
  `)
  .eq('role_id', roleId)
```

## Security Model

- **RLS Policies**: All tables enforce `auth.uid() = user_id`
- **Auth Flow**: Proxy updates session on every request, redirects to `/login` for protected routes
- **Edge Runtime**: Provides request isolation and security boundaries
- **API Key Storage**: Fully encrypted with AES-256-GCM
- **HTTPS**: Enforced by Vercel and Supabase in production

## File Locations Reference

**API Routes**:
- Basic chat: [app/api/chat/route.ts](app/api/chat/route.ts)
- Role chat: [app/api/roles/[roleId]/chat/route.ts](app/api/roles/[roleId]/chat/route.ts)

**Components**:
- Chat UI: [components/chat/chat-interface.tsx](components/chat/chat-interface.tsx)
- UI primitives: [components/ui/](components/ui/)
- Role cards: [components/roles/](components/roles/)
  - `role-card.tsx` - Main card with tier badge, skills, traits
  - `tier-badge.tsx` - Model tier badge (Legendary/Epic/Rare/Common)
  - `skill-list.tsx` - Resolved skill names with icons
  - `personality-traits.tsx` - Identity facets display

**Utilities**:
- Model tiers: [lib/utils/model-tiers.ts](lib/utils/model-tiers.ts)

**MCP Integration**:
- Protocol types: [lib/mcp/types.ts](lib/mcp/types.ts)
- SSE client: [lib/mcp/client.ts](lib/mcp/client.ts)
- Error handling: [lib/mcp/errors.ts](lib/mcp/errors.ts)
- URL validation: [lib/mcp/url-validation.ts](lib/mcp/url-validation.ts)
- Tool integration: [lib/tools/mcp-tools.ts](lib/tools/mcp-tools.ts)
- Server actions: [app/actions/mcp.ts](app/actions/mcp.ts)
- Settings UI: [components/settings/role-mcp-manager.tsx](components/settings/role-mcp-manager.tsx)

**Skills & Prompts**:
- Skill execution: [lib/skills/execute-skill.ts](lib/skills/execute-skill.ts)
- System prompt builder: [lib/prompts/system-prompt-builder.ts](lib/prompts/system-prompt-builder.ts)

**Supabase Clients**:
- Server: [lib/supabase/server.ts](lib/supabase/server.ts)
- Browser: [lib/supabase/client.ts](lib/supabase/client.ts)
- Auth middleware: [lib/supabase/middleware.ts](lib/supabase/middleware.ts)
- Proxy: [proxy.ts](proxy.ts)

**Types**:
- Generated DB types: [types/database.types.ts](types/database.types.ts)
- Custom types: [types/identity.ts](types/identity.ts), [types/role.ts](types/role.ts), etc.
- Key role types:
  - `Role` - Base role interface
  - `RoleWithSkills` - Extended with `resolved_skills[]` and `lore_count`
  - `ResolvedSkill` - Skill with id, name, description (for display)
  - `Lore` - Lore item with id, name, content, type

**Database**:
- Schema: [supabase/migrations/20250101000000_initial_schema.sql](supabase/migrations/20250101000000_initial_schema.sql)

**Documentation**:
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Chat implementation: [docs/CHAT_IMPLEMENTATION.md](docs/CHAT_IMPLEMENTATION.md)
- Development guide: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

## Environment Variables

Required in `.env.local`:
```bash
# Supabase (get from https://supabase.com/dashboard or `npx supabase start`)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Providers (system fallback keys when users don't BYO)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Encryption (required for BYO API key feature)
ENCRYPTION_MASTER_KEY=your-secure-random-string-at-least-32-chars

# Web Tools (optional - for web search and fetch)
BRAVE_API_KEY=...      # https://brave.com/search/api/
# OR
SERPER_API_KEY=...     # https://serper.dev/
```

## Current Status

**Completed**:
- ✅ Next.js 16 + Supabase foundation
- ✅ Database schema with RLS
- ✅ Chat streaming (OpenAI, Anthropic)
- ✅ Role-based chat with identity injection
- ✅ Lore composition in system prompts
- ✅ shadcn/ui components
- ✅ API key encryption/decryption
- ✅ Web tools (search, fetch) with agentic loop
- ✅ Prompt caching for cost savings
- ✅ RPG-style role cards with model tiers (Legendary/Epic/Rare/Common)
- ✅ Skills system with junction table linking
- ✅ Nova (personality interview) and Forge (role creation) AI assistants
- ✅ Chat history persistence with conversation list
- ✅ MCP server integration (SSE transport, role-level, test connection UI)
- ✅ Progressive disclosure skills (3-level architecture with agentic tool execution)

**TODO**:
- 🚧 Spend tracking and limits
- 🚧 Engagement-based leveling (skill improvement through use)
