# CLAUDE.md

## Project Overview

RoleplAI Teams — AI identity management platform where users create **RoleplAIrs** (AI agents) with consistent personalities. Built with Next.js 16, Supabase, Vercel AI SDK v6, Edge Runtime.

**AI Characters**: Nova (onboarding interviewer), Forge (role builder)
**Co-founders**: Ryan (CEO), Anthony (CTO), Rob (COO), Thomas (CDS) — all use Claude Code. Describe features in plain English; Claude builds them safely.

## Development Commands

```bash
npm run dev           # Dev server (http://localhost:3000)
npm run build         # Production build
npm run lint          # ESLint
npx tsc --noEmit      # Type check
npx supabase start    # Local DB (Docker required)
npx supabase db reset # Reset DB with all migrations
npx supabase gen types typescript --local > types/database.types.ts
```

## Critical Gotchas

1. **Auth uses `proxy.ts`, NOT `middleware.ts`** — middleware.ts was deleted. Never recreate it.
2. **AI SDK v6 breaking changes** — hooks in `@ai-sdk/react`, transport-based design, `parts` array for messages, `sendMessage()` not `handleSubmit()`. See `.claude/rules/ai-sdk.md`.
3. **Supabase server client is async** (`await createClient()`), browser client is NOT.
4. **All API routes use Edge Runtime** (`export const runtime = 'edge'`).
5. **Model preference format**: `provider/model` (e.g., `anthropic/claude-sonnet-4-6`), split with `/`.

## Core Concepts

- **Identity Core** — User's base personality (voice, priorities, boundaries, decision_rules). One per user, in `identity_cores` table.
- **Roles (RoleplAIrs)** — AI agent configs with instructions, identity_facets, approval_policy, model_preference. Skills linked via `role_skills` junction table.
- **Lore** — Reusable knowledge snippets (bio/brand/rules/custom) attached to roles via `role_lore` junction table.
- **Skills** — Functions roles can execute. 3-level progressive disclosure. See `.claude/rules/skills.md`.
- **BYO API Keys** — AES-256-GCM encrypted, falls back to system keys.

## Two Chat Endpoints

1. `app/api/chat/route.ts` — Basic testing chat, no identity injection
2. `app/api/roles/[roleId]/chat/route.ts` — Production: identity + role + lore + skills + MCP tools + prompt caching

## Common Patterns

### Supabase Client
```typescript
// Server (async!)
const supabase = await createClient()
// Browser (sync)
const supabase = createClient()
```

### API Route
```typescript
export const runtime = 'edge'
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // RLS enforces user_id checks automatically
}
```

### Streaming AI
```typescript
const result = streamText({
  model: anthropic('claude-sonnet-4-6'),
  messages: [{ role: 'system', content: systemPrompt }, ...userMessages],
})
return result.toTextStreamResponse()
```

### Path Aliases
Use `@/` for project root: `import { Button } from '@/components/ui/button'`

## Safety Rules

- **Always work on a feature branch** — never commit directly to master
- **Run `/check` before committing** — lint + typecheck + build
- **Never delete**: `proxy.ts`, `lib/supabase/middleware.ts`, migration files
- **Never recreate**: `middleware.ts`
- **Never commit** `.env*` files

## Key File Locations

| Area | Files |
|------|-------|
| Chat API | `app/api/chat/route.ts`, `app/api/roles/[roleId]/chat/route.ts` |
| Chat UI | `components/chat/chat-interface.tsx` |
| Roles | `components/roles/`, `app/actions/roles.ts` |
| Auth | `proxy.ts`, `lib/supabase/middleware.ts`, `lib/supabase/server.ts` |
| Skills | `lib/skills/execute-skill.ts`, `lib/prompts/system-prompt-builder.ts` |
| MCP | `lib/mcp/`, `lib/tools/mcp-tools.ts`, `app/actions/mcp.ts` |
| Types | `types/database.types.ts`, `types/role.ts`, `types/identity.ts` |
| DB Schema | `supabase/migrations/20250101000000_initial_schema.sql` |
| UI | `components/ui/`, Tailwind CSS 4, shadcn/ui |
| Model Tiers | `lib/utils/model-tiers.ts` (Legendary/Epic/Rare/Common) |

## Detailed Reference

Topic-specific details are in `.claude/rules/`:
- `ai-sdk.md` — AI SDK v6 patterns, transport, streaming
- `database.md` — Schema, RLS, migrations, type generation
- `mcp.md` — MCP server integration, SSE client, tool routing
- `skills.md` — Progressive disclosure, execution, agentic tools
- `security.md` — Auth proxy, encryption, Edge runtime
- `ui-patterns.md` — shadcn/ui, Tailwind, model tiers, RPG theme
