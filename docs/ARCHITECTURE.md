# Architecture - RoleplayAI Teams

## Overview

RoleplayAI Teams is a Next.js 16 application that enables users to create personalized AI agents with consistent identities across different contexts. The architecture emphasizes modularity, type safety, and optimized performance for AI chat streaming.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │   UI Layer    │  │  API Routes   │  │  Middleware   │  │
│  │  (React 19)   │  │ (Edge Runtime)│  │   (Auth)      │  │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  │
└──────────┼──────────────────┼──────────────────┼──────────┘
           │                  │                  │
           ▼                  ▼                  ▼
    ┌──────────────────────────────────────────────────┐
    │          Supabase (Backend as a Service)         │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
    │  │   Auth   │  │ Database │  │     RLS      │  │
    │  │ (JWT)    │  │(Postgres)│  │  (Security)  │  │
    │  └──────────┘  └──────────┘  └──────────────┘  │
    └──────────────────────────────────────────────────┘
                          │
                          ▼
            ┌──────────────────────────────┐
            │    AI Provider APIs          │
            │  - OpenAI (GPT-4)            │
            │  - Anthropic (Claude)        │
            └──────────────────────────────┘
```

## Directory Structure

```
roleplai_teams/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (Edge Runtime)
│   │   ├── chat/                 # Basic chat endpoint
│   │   │   └── route.ts          # Generic AI chat
│   │   └── roles/[roleId]/       # Role-specific endpoints
│   │       └── chat/route.ts     # Chat with identity injection
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── chat/page.tsx             # Chat demo page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...                   # Other UI components
│   └── chat/                     # Chat-specific components
│       └── chat-interface.tsx    # Main chat UI
│
├── lib/                          # Shared utilities
│   ├── supabase/                 # Supabase client configs
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (cookies)
│   │   └── middleware.ts         # Auth session update logic
│   └── utils.ts                  # Utility functions (cn, etc.)
│
├── types/                        # TypeScript type definitions
│   ├── database.types.ts         # Generated from Supabase
│   ├── identity.ts               # Identity core types
│   ├── role.ts                   # Role types
│   ├── skill.ts                  # Skill types
│   └── task.ts                   # Task types
│
├── supabase/                     # Database & migrations
│   ├── migrations/               # SQL migration files
│   │   └── 20250101000000_initial_schema.sql
│   └── config.toml               # Supabase config (if using local)
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md           # This file
│   ├── CHAT_IMPLEMENTATION.md    # Chat system details
│   └── DEVELOPMENT.md            # Development guide
│
├── .claude/                      # Claude Code context
│   ├── commands/                 # Custom slash commands
│   └── README.md                 # Project context for AI
│
├── .vscode/                      # VSCode configuration
│   ├── settings.json
│   ├── tasks.json
│   ├── launch.json
│   └── snippets/
│
├── public/                       # Static assets
├── proxy.ts                      # Next.js proxy (auth via lib/supabase/middleware.ts)
└── [config files]                # package.json, tsconfig.json, etc.
```

## Core Layers

### 1. Presentation Layer (UI)

**Technology:** React 19, Tailwind CSS 4, shadcn/ui

**Key Components:**
- `chat-interface.tsx`: Streaming chat with Vercel AI SDK v5
- UI primitives: Button, Input, Card, Dialog, etc.

**Patterns:**
- Server Components by default (faster initial load)
- Client Components only when needed (`'use client'` directive)
- Composition over inheritance for UI components

### 2. API Layer (Backend)

**Technology:** Next.js API Routes, Edge Runtime

**Endpoints:**

```typescript
// Basic chat (testing/development)
POST /api/chat
{
  "messages": Message[],
  "provider": "openai" | "anthropic",
  "model": string
}

// Role-based chat (production)
POST /api/roles/{roleId}/chat
{
  "messages": Message[]
}
```

**Features:**
- Edge Runtime for low latency and streaming
- Authentication via Supabase Auth
- Automatic RLS enforcement on queries
- BYO API key support with fallback to system keys

### 3. Data Layer

**Technology:** Supabase (PostgreSQL)

**Core Tables:**
- `profiles`: User metadata
- `identity_cores`: User's base AI personality
- `roles`: AI agent configurations
- `context_packs`: Reusable context snippets
- `user_api_keys`: Encrypted BYO API keys
- `tasks`: Task tracking (future)

**Security:**
- Row-Level Security (RLS) on all tables
- Foreign key constraints for data integrity
- Policies enforce user isolation
- JWT-based authentication

### 4. AI Integration Layer

**Technology:** Vercel AI SDK v5

**Providers:**
- OpenAI: GPT-4, GPT-4 Turbo
- Anthropic: Claude 3.5 Sonnet, Claude 3 Opus

**Flow:**
1. User sends message
2. API route authenticates user
3. Fetch role + identity + context from database
4. Compose system prompt
5. Stream response from AI provider
6. Return to client via Server-Sent Events (SSE)

## Data Flow

### Role-Based Chat Flow

```
User sends message
    │
    ▼
ChatInterface (client)
    │ useChat() hook
    ▼
POST /api/roles/{roleId}/chat
    │
    ├─► Authenticate user (Supabase)
    │
    ├─► Fetch role (verify ownership)
    │
    ├─► Fetch identity_core
    │
    ├─► Fetch context_packs
    │
    ├─► Compose system prompt
    │   ├─ Identity Core (voice, priorities, boundaries)
    │   ├─ Role instructions
    │   └─ Context packs
    │
    ├─► Get user's API key or use system fallback
    │
    ├─► Initialize AI provider
    │
    └─► Stream response
            │
            ▼
        Client receives tokens in real-time
            │
            ▼
        Display in chat interface
```

## Security Model

### Authentication
- Supabase Auth handles JWT tokens
- Middleware updates session on each request
- Cookies store auth state (httpOnly, secure)

### Authorization
- Row-Level Security (RLS) policies on all tables
- Policies check `auth.uid() = user_id`
- API routes verify role ownership before chat

### Data Protection
- API keys stored encrypted (TODO: implement decryption)
- Environment variables for system secrets
- HTTPS in production (enforced by Vercel/Supabase)

## Performance Optimizations

### Edge Runtime
- API routes run on Vercel Edge Network
- Reduced cold start times
- Geographically distributed for low latency

### Streaming
- Server-Sent Events (SSE) for real-time responses
- Tokens stream as generated (no waiting for full response)
- Better perceived performance

### Database Queries
- Indexes on frequently queried columns
- `select()` only needed columns
- `maybeSingle()` for optional relations
- Minimize round trips (fetch related data in one query)

### React Optimizations
- Server Components reduce client bundle size
- Dynamic imports for heavy components
- Image optimization via `next/image`

## Type Safety

### Generated Types
```bash
npx supabase gen types typescript --local > types/database.types.ts
```

### Custom Types
- `types/identity.ts`: Identity core interfaces
- `types/role.ts`: Role configuration
- `types/skill.ts`, `types/task.ts`: Future features

### TypeScript Config
- Strict mode enabled
- Path aliases (`@/*`)
- React JSX transform

## Development Workflow

### Local Development
1. Start Supabase: `npx supabase start`
2. Apply migrations: `npx supabase db reset`
3. Generate types: `npx supabase gen types typescript --local > types/database.types.ts`
4. Start dev server: `npm run dev`

### Making Changes
1. **Database changes**: Create migration → Apply → Generate types
2. **API changes**: Update route → Test with curl/Postman
3. **UI changes**: Edit component → Check browser

### Testing
- Manual testing via `/chat` page
- API testing with curl/Postman
- Type checking: `npx tsc --noEmit`
- Linting: `npm run lint`

## Deployment

### Production Stack
- **Hosting**: Vercel (recommended)
- **Database**: Supabase Cloud
- **AI**: OpenAI/Anthropic APIs

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Deployment Steps
1. Push to GitHub
2. Import to Vercel
3. Configure environment variables
4. Deploy

## Future Enhancements

### Planned Features
- [ ] API key encryption/decryption
- [ ] Tool/function calling with approval workflow
- [ ] Chat history persistence
- [ ] Team collaboration (shared roles/context)
- [ ] Spend tracking and limits
- [ ] Advanced analytics

### Potential Improvements
- Redis caching for frequently accessed data
- WebSocket for bidirectional communication
- Background jobs for async tasks
- Rate limiting per user
- Audit logging

## Key Design Decisions

### Why Edge Runtime?
- Streaming AI responses require long-lived connections
- Edge functions support streaming better than serverless
- Lower latency for global users

### Why Supabase?
- Built-in authentication
- PostgreSQL with RLS for security
- Real-time subscriptions (future use)
- Auto-generated TypeScript types

### Why Vercel AI SDK?
- Provider-agnostic (OpenAI, Anthropic, etc.)
- Streaming built-in
- React hooks for easy integration
- Active development and community

### Why Next.js App Router?
- Server Components reduce bundle size
- Nested layouts for better UX
- File-based routing is intuitive
- Built-in optimizations (images, fonts, etc.)

## Troubleshooting

Common issues and solutions documented in [DEVELOPMENT.md](./DEVELOPMENT.md).

## Additional Resources

- [Chat Implementation Details](./CHAT_IMPLEMENTATION.md)
- [Development Guide](./DEVELOPMENT.md)
- [Database Schema](../supabase/migrations/20250101000000_initial_schema.sql)
- [Claude Code Context](../.claude/README.md)
