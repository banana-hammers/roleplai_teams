# Security

## Authentication

**CRITICAL**: This project uses `proxy.ts` for auth middleware, NOT `middleware.ts` (deleted).
- `proxy.ts` — Exports `proxy()` function and matcher config
- `lib/supabase/middleware.ts` — Contains `updateSession()` logic
- Public routes (no auth): `/`, `/login`, `/signup`, `/auth`, `/chat`

## Row-Level Security (RLS)

All tables enforce `auth.uid() = user_id`. RLS policies provide multi-tenant isolation automatically — no need for manual user_id filtering in queries when authenticated.

## API Key Encryption

Fully implemented using AES-256-GCM with PBKDF2 key derivation:
- Encryption utility: `lib/crypto/api-key-encryption.ts`
- Keys encrypted on save: `app/api/user/api-keys/route.ts`
- Keys decrypted in all chat endpoints before use
- Requires `ENCRYPTION_MASTER_KEY` env var (min 32 chars)
- Falls back to system keys if user has no BYO keys

## Edge Runtime

All API routes use Edge Runtime (`export const runtime = 'edge'`) for:
- Request isolation and security boundaries
- Streaming compatibility
- No subprocess spawning (affects MCP — SSE only)

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=sk-...              # System fallback
ANTHROPIC_API_KEY=sk-ant-...        # System fallback
ENCRYPTION_MASTER_KEY=...           # Min 32 chars
```

## Files to Never Delete

- `proxy.ts`
- `lib/supabase/middleware.ts`
- Any `supabase/migrations/*` file

## Files to Never Recreate

- `middleware.ts` (Next.js standard — we use proxy.ts instead)
