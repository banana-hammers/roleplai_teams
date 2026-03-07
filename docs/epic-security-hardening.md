# Epic: Security Hardening for API Keys and Chat

## Status: Implemented

**Last Updated:** December 2025 (post-Vercel optimization)

This document describes the security vulnerabilities identified and the fixes implemented.

---

## Architecture Note

The project uses **Direct Anthropic API** on Vercel Edge, not the Claude Agent SDK. This simplifies the security model:

| Feature | Old (SDK) | Current (Edge) |
|---------|-----------|----------------|
| File Operations | Needed sandboxing | N/A (no filesystem) |
| Bash Commands | Needed validation | N/A (no shell) |
| MCP Servers | Needed env whitelisting | SSE only, URL validation |
| Tool Permissions | Complex validation | Web tools + MCP tools |

---

## P0: Critical Issues (Fixed)

### 1. API Key Encryption
**Status:** Implemented

**Problem:** API keys were stored in plaintext in `user_api_keys.encrypted_key` column.

**Solution:**
- Created [lib/crypto/api-key-encryption.ts](../lib/crypto/api-key-encryption.ts) using AES-GCM via Web Crypto API
- Per-user key derivation using PBKDF2 with user ID as salt
- Server-side encryption via [app/api/user/api-keys/route.ts](../app/api/user/api-keys/route.ts)
- Decryption on API routes before use

**Environment Variable Required:**
```bash
ENCRYPTION_MASTER_KEY=<32+ character secret>
```

---

## P1: High Severity Issues (Fixed)

### 2. Rate Limiting
**Status:** Implemented

**Problem:** No rate limiting allowed abuse of expensive AI API calls.

**Solution:**
- Created [lib/rate-limit.ts](../lib/rate-limit.ts) with in-memory rate limiter
- Applied to chat endpoint (30/min)
- Returns 429 with Retry-After header when exceeded

**Note:** For production at scale, consider Vercel KV or Upstash Redis.

---

### 3. Authentication Required for Chat
**Status:** Implemented

**Problem:** `/api/chat` allowed unauthenticated access to system API keys.

**Solution:** Added authentication check that returns 401 for unauthenticated requests.

**File:** [app/api/chat/route.ts](../app/api/chat/route.ts)

---

### 4. Skill Template Input Sanitization
**Status:** Implemented

**Problem:** User input directly interpolated into prompt templates without validation.

**Solution:**
- Added `MAX_INPUT_LENGTH` (100KB) to prevent DoS
- Added `isValidPlaceholderKey()` to validate placeholder names
- Invalid keys are skipped with warning

**File:** [lib/skills/to-anthropic-tools.ts](../lib/skills/to-anthropic-tools.ts)

---

## Removed Security Features (No Longer Needed)

The following security features were removed because they applied to the Claude Agent SDK which is no longer used:

| Feature | Original File | Status |
|---------|--------------|--------|
| Process.env mutation fix | `agent/route.ts` | N/A - endpoint removed |
| Dangerous tool validation | `lib/agent/tool-permissions.ts` | N/A - file removed |
| MCP env var whitelist | `lib/agent/mcp-resolver.ts` | N/A - file removed |

These were necessary when using the SDK to spawn Claude Code as a child process. With the Edge-based architecture, these attack vectors don't exist.

---

## Current Security Model

### Web Tools Security

Built-in tools (`web_search`, `web_fetch`) plus MCP external tools:

| Tool | Security Consideration | Mitigation |
|------|----------------------|------------|
| `web_search` | API key exposure | Server-side only, not in responses |
| `web_fetch` | SSRF risk | Only HTTP/HTTPS, user-agent set, URL validation |
| `web_fetch` | Large response DoS | Content truncated to 50KB |
| MCP tools | External server trust | User-managed servers, URL validation, role-level isolation |

### API Key Security

| Layer | Protection |
|-------|-----------|
| Storage | AES-256-GCM encrypted |
| Derivation | PBKDF2 with user ID salt |
| Access | RLS policies enforce user isolation |
| Fallback | System keys if user has none |

---

## Files Modified

| File | Changes |
|------|---------|
| `lib/crypto/api-key-encryption.ts` | AES-GCM encryption |
| `lib/rate-limit.ts` | Rate limiting |
| `app/api/user/api-keys/route.ts` | Server-side key encryption |
| `app/api/chat/route.ts` | Auth required, decryption |
| `app/api/roles/[roleId]/chat/route.ts` | Decryption, web tools |
| `components/settings/api-keys-settings.tsx` | Use server API for encryption |
| `lib/skills/to-anthropic-tools.ts` | Input sanitization |

---

## Environment Variables Required

```bash
# Required for API key encryption
ENCRYPTION_MASTER_KEY=<32+ character secret>

# AI providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Web tools (optional)
BRAVE_API_KEY=...
# OR
SERPER_API_KEY=...
```

---

## Testing Recommendations

- [x] Test encryption/decryption roundtrip
- [x] Test rate limit 429 responses
- [x] Test template input length truncation
- [ ] Test web fetch URL validation
- [ ] Test web fetch content truncation
