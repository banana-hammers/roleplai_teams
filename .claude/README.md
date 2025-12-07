# RoleplayAI Teams - Project Context for Claude

## Project Overview

RoleplayAI Teams is an AI-powered identity management and chat platform built with Next.js 16, Supabase, and Vercel AI SDK. It enables users to create AI agents with personalized identities, roles, and context.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Runtime**: Edge Runtime for API routes (streaming optimized)
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **AI**: Vercel AI SDK with OpenAI and Anthropic providers
- **UI**: React 19, Tailwind CSS 4, Radix UI components
- **Auth**: Supabase Auth
- **TypeScript**: Strict mode enabled

### Directory Structure

```
app/                          # Next.js App Router
├── api/                      # API routes (Edge Runtime)
│   ├── chat/route.ts         # Base chat endpoint (testing)
│   └── roles/[roleId]/chat/route.ts  # Role-specific chat
├── chat/page.tsx             # Chat demo UI
├── login/page.tsx            # Login page
├── signup/page.tsx           # Signup page
└── page.tsx                  # Home page

components/
├── ui/                       # shadcn/ui components
└── chat/
    └── chat-interface.tsx    # Reusable chat component

lib/                          # Shared utilities
├── supabase/
│   ├── client.ts             # Browser client
│   ├── server.ts             # Server client (cookies-based)
│   └── middleware.ts         # Auth session update logic
└── utils.ts                  # cn() utility for Tailwind

types/                        # TypeScript types
├── database.types.ts         # Generated from Supabase schema
├── identity.ts               # Identity core types
├── role.ts                   # Role types
├── skill.ts                  # Skill types
└── task.ts                   # Task types

docs/                         # Documentation
├── ARCHITECTURE.md           # System architecture
├── CHAT_IMPLEMENTATION.md    # Chat system details
└── DEVELOPMENT.md            # Development guide

supabase/                     # Database & migrations
└── migrations/
    └── 20250101000000_initial_schema.sql

.claude/                      # Claude Code context
├── commands/                 # Custom slash commands
└── README.md                 # This file

.vscode/                      # VSCode configuration
├── settings.json
├── tasks.json
└── snippets/

proxy.ts                      # Next.js proxy (auth via lib/supabase/middleware.ts)
```

## Core Concepts

### 1. Identity Core
The foundational personality/behavior of a user's AI agents:
- **Voice**: Communication style (formal, casual, technical, etc.)
- **Priorities**: What matters most to the AI
- **Boundaries**: What the AI won't do
- **Decision Rules**: How to make choices

### 2. Roles
Specific use cases for AI agents, linked to identity cores:
- **Instructions**: Role-specific behavior
- **Identity Facets**: Role-specific personality adjustments
- **Allowed Tools**: Functions the role can execute
- **Approval Policy**: always, never, or smart
- **Model Preference**: OpenAI or Anthropic model choice

### 3. Context Packs
Reusable context snippets that can be attached to roles:
- **Bio**: Personal background information
- **Brand**: Company/brand guidelines
- **Rules**: Domain-specific rules
- **Custom**: Any other context

### 4. Chat System
Two endpoints:
- `/api/chat`: Basic chat for testing (no identity injection)
- `/api/roles/[roleId]/chat`: Full role-based chat with identity

System prompt composition for role-based chat:
1. Identity Core (voice, priorities, boundaries, decision rules)
2. Role definition (name, description, instructions)
3. Identity facets specific to the role
4. Allowed tools
5. Approval policy
6. Context packs (bio, brand, rules, custom)

## Database Schema (Key Tables)

### profiles
- Extends `auth.users`
- Stores user metadata

### identity_cores
- One per user (can be extended to multiple)
- JSONB fields for flexible personality definition

### roles
- Many per user
- Links to identity_core
- Defines specific agent use cases

### context_packs
- Many per user
- Can be attached to multiple roles via junction table

### user_api_keys (TODO: encryption)
- Bring-your-own API keys
- Provider: openai, anthropic, etc.
- Encrypted storage (not yet implemented)

## Common Development Patterns

### Creating API Routes
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'  // For streaming and low latency

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Query with RLS automatically enforced
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('user_id', user.id)

  return NextResponse.json({ data })
}
```

### Using Supabase Client (Browser)
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('roles').select('*')
```

### Using Supabase Client (Server)
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()  // Note: awaited
const { data } = await supabase.from('roles').select('*')
```

### Streaming AI Responses
```typescript
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const result = streamText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  messages: [...],
  system: systemPrompt,  // Identity + role context
})

return result.toDataStreamResponse()
```

## Environment Variables

Required in `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Providers (fallback when user doesn't BYO)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Security Model

- **Row-Level Security (RLS)**: All tables have RLS policies
- **Auth**: Supabase Auth with proxy-based session management (proxy.ts)
- **API Keys**: TODO - Implement encryption/decryption
- **Edge Runtime**: Runs in isolated environment

## Naming Conventions

- **Components**: PascalCase (ChatInterface.tsx)
- **Files**: kebab-case (chat-interface.tsx)
- **API Routes**: Use Next.js file-based routing
- **Database**: snake_case tables and columns
- **Types**: PascalCase interfaces/types

## Path Aliases

Use `@/` to reference project root:
```typescript
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import type { Role } from '@/types/role'
```

## Current Status

✅ **Completed**
- Phase 1: Basic Next.js + Supabase setup
- Phase 2: Database schema with RLS
- Chat streaming with OpenAI/Anthropic
- Role-based chat with identity injection
- UI components (shadcn/ui)

🚧 **In Progress**
- API key encryption
- Authentication UI polish
- Role management UI

📋 **TODO**
- Function calling / tool execution
- Approval workflow for sensitive actions
- Task tracking from chat interactions
- Chat history persistence
- Spend tracking for API usage

## Documentation

For detailed information, see:
- [📐 Architecture](../docs/ARCHITECTURE.md) - System design and structure
- [💬 Chat Implementation](../docs/CHAT_IMPLEMENTATION.md) - Chat system details
- [🛠️ Development Guide](../docs/DEVELOPMENT.md) - Setup and workflows

## Useful Commands

See `.claude/commands/` for available slash commands.

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Radix UI](https://www.radix-ui.com/)
