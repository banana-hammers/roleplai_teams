# Database — Supabase & PostgreSQL

## Schema

All tables use **Row-Level Security (RLS)** for multi-tenant isolation. Policies check `auth.uid() = user_id`.

**Core tables**:
- `profiles` — Extends `auth.users` with metadata
- `identity_cores` — User's base AI personality (voice, priorities, boundaries, decision_rules)
- `roles` — AI agent configurations (RoleplAIrs)
- `lore` — Reusable knowledge snippets (bio/brand/rules/custom)
- `role_lore` — Junction: roles ↔ lore
- `skills` — Skill definitions with prompt templates
- `role_skills` — Junction: roles ↔ skills
- `user_api_keys` — Encrypted BYO API keys
- `conversations` — Chat history with messages
- `mcp_servers` — MCP server configs (SSE transport, role-level)

All `user_id` columns are indexed.

**Schema file**: `supabase/migrations/20250101000000_initial_schema.sql`

## Type Generation

After any schema change:
```bash
npx supabase gen types typescript --local > types/database.types.ts
```

## Client Usage

**Server Components / API Routes** (async!):
```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

**Client Components** (sync):
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

## Lore Fetching Pattern

Uses nested select with junction table:
```typescript
const { data: roleLore } = await supabase
  .from('role_lore')
  .select(`
    lore_id,
    lore (name, content, type)
  `)
  .eq('role_id', roleId)
```

## Migration Workflow

1. Create migration: `npx supabase migration new <name>`
2. Write SQL in the generated file
3. Apply: `npx supabase db reset`
4. Regenerate types: `npx supabase gen types typescript --local > types/database.types.ts`

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
