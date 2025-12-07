# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RoleplayAI Teams is an AI-powered identity management and chat platform that enables users to create AI agents with personalized, consistent identities across different contexts. Built with Next.js 16, Supabase, and Vercel AI SDK v5, it combines identity cores, role-based agents, and reusable context packs to create sophisticated AI interactions.

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
   - Fetches user's identity core, role, and context packs
   - Composes system prompt from all sources
   - Enforces role ownership via RLS

### System Prompt Composition

For role-based chat, the system prompt is composed in this order:

1. **Identity Core** - User's base personality (voice, priorities, boundaries, decision rules)
2. **Role Definition** - Name, description, and role-specific instructions
3. **Identity Facets** - Role-specific personality adjustments
4. **Allowed Tools** - Functions the role can execute (JSONB array)
5. **Approval Policy** - `always`, `never`, or `smart`
6. **Context Packs** - Linked context snippets (bio, brand, rules, custom)

See [app/api/roles/[roleId]/chat/route.ts:56-102](app/api/roles/[roleId]/chat/route.ts#L56-L102) for implementation.

## Core Concepts

### Identity Core
The foundational personality shared across all of a user's AI agents:
- **voice**: Communication style (TEXT)
- **priorities**: What matters most (JSONB)
- **boundaries**: What the AI won't do (JSONB)
- **decision_rules**: How to make choices (JSONB)

One identity core per user, fetched from `identity_cores` table.

### Roles
Specific AI agent configurations linked to an identity core:
- **instructions**: Role-specific behavior (TEXT)
- **identity_facets**: Role-specific personality adjustments (JSONB)
- **allowed_tools**: Functions the role can execute (JSONB array)
- **approval_policy**: ENUM (`always`, `never`, `smart`)
- **model_preference**: Format: `provider/model` (e.g., `anthropic/claude-3-5-sonnet-20241022`)

Many roles per user, stored in `roles` table.

### Context Packs
Reusable context snippets that can be attached to multiple roles:
- **Type**: ENUM (`bio`, `brand`, `rules`, `custom`)
- **Content**: Markdown or plain text
- Linked to roles via `role_context_packs` junction table

### BYO API Keys
Users can bring their own OpenAI/Anthropic API keys:
- Stored in `user_api_keys` table
- **TODO**: Encryption/decryption not yet implemented (schema ready)
- Falls back to system keys from environment variables

## Database Schema

All tables use **Row-Level Security (RLS)** for multi-tenant isolation. Policies check `auth.uid() = user_id`.

**Core tables**:
- `profiles` - Extends `auth.users` with metadata
- `identity_cores` - User's base AI personality
- `roles` - AI agent configurations
- `context_packs` - Reusable context snippets
- `role_context_packs` - Junction table (many-to-many)
- `user_api_keys` - Encrypted BYO API keys (encryption TODO)
- `skills` - Skill definitions (future feature)
- `tasks` - Task tracking with approval workflow
- `task_approvals` - Approval requests for sensitive actions

**Indexes**: All `user_id` columns are indexed. Additional indexes on `tasks.status`.

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
- Schema is ready in `user_api_keys.encrypted_key` column
- Encryption/decryption logic is **NOT** implemented
- Both chat endpoints have TODO comments for decryption
- Currently falls back to system keys from environment variables

### Model Preference Format
Stored in `roles.model_preference` as `provider/model`:
- Example: `anthropic/claude-3-5-sonnet-20241022`
- Example: `openai/gpt-4-turbo-preview`
- Parsed with `split('/')` in [app/api/roles/[roleId]/chat/route.ts:105-106](app/api/roles/[roleId]/chat/route.ts#L105-L106)

### Context Pack Fetching
Uses nested select with junction table:
```typescript
const { data: contextPacks } = await supabase
  .from('role_context_packs')
  .select(`
    context_pack_id,
    context_packs (
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
- **API Key Storage**: Encrypted column ready, decryption logic TODO
- **HTTPS**: Enforced by Vercel and Supabase in production

## File Locations Reference

**API Routes**:
- Basic chat: [app/api/chat/route.ts](app/api/chat/route.ts)
- Role chat: [app/api/roles/[roleId]/chat/route.ts](app/api/roles/[roleId]/chat/route.ts)

**Components**:
- Chat UI: [components/chat/chat-interface.tsx](components/chat/chat-interface.tsx)
- UI primitives: [components/ui/](components/ui/)

**Supabase Clients**:
- Server: [lib/supabase/server.ts](lib/supabase/server.ts)
- Browser: [lib/supabase/client.ts](lib/supabase/client.ts)
- Auth middleware: [lib/supabase/middleware.ts](lib/supabase/middleware.ts)
- Proxy: [proxy.ts](proxy.ts)

**Types**:
- Generated DB types: [types/database.types.ts](types/database.types.ts)
- Custom types: [types/identity.ts](types/identity.ts), [types/role.ts](types/role.ts), etc.

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
```

## Current Status

**Phase 1 & 2 Complete**:
- ✅ Next.js 16 + Supabase foundation
- ✅ Database schema with RLS
- ✅ Chat streaming (OpenAI, Anthropic)
- ✅ Role-based chat with identity injection
- ✅ Context pack composition
- ✅ shadcn/ui components

**TODO**:
- ⚠️ API key encryption/decryption
- 🚧 Chat history persistence
- 🚧 Tool/function calling with approval workflow
- 🚧 Task tracking UI
- 🚧 Spend tracking and limits
