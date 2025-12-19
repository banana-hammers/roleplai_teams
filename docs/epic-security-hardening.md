# Epic: Security Hardening for Agent Capabilities and API Keys

## Status: Implemented

This document describes the security vulnerabilities identified and the fixes implemented.

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

### 2. Process.env Mutation Race Condition
**Status:** Fixed

**Problem:** Agent route mutated `process.env.ANTHROPIC_API_KEY`, causing race conditions between concurrent requests.

**Solution:** Pass API key via SDK's `env` option instead:
```typescript
const options: Options = {
  // ...
  env: {
    ...process.env,
    ANTHROPIC_API_KEY: apiKey, // Isolated per-request
  },
}
```

**File:** [app/api/roles/[roleId]/agent/route.ts](../app/api/roles/[roleId]/agent/route.ts)

---

## P1: High Severity Issues (Fixed)

### 3. Dangerous Tool Combination Validation
**Status:** Implemented

**Problem:** `approval_policy: 'never'` with dangerous tools like Bash could allow destructive operations.

**Solution:**
- Added `DANGEROUS_TOOLS` constant: `['Bash', 'Write', 'Edit', 'Task']`
- `mapApprovalPolicy()` now automatically upgrades to `'acceptEdits'` when dangerous tools are present
- Added `validateToolPermissionCombination()` for explicit validation

**File:** [lib/agent/tool-permissions.ts](../lib/agent/tool-permissions.ts)

---

### 4. MCP Environment Variable Whitelist
**Status:** Implemented

**Problem:** MCP config `${VAR_NAME}` placeholders could access any environment variable, including secrets.

**Solution:**
- Added `ALLOWED_MCP_ENV_VARS` whitelist with safe integration tokens
- Non-whitelisted variables are blocked with warning logged

**File:** [lib/agent/mcp-resolver.ts](../lib/agent/mcp-resolver.ts)

---

### 5. Improved Tool Disallow Pattern Matching
**Status:** Implemented

**Problem:** Simple string `includes()` could be bypassed with extra whitespace.

**Solution:**
- Added `normalizeForMatching()` to collapse whitespace
- Added regex pattern support with `regex:` prefix
- Both original and normalized strings checked

**File:** [lib/agent/tool-permissions.ts](../lib/agent/tool-permissions.ts)

---

## P2: Medium Severity Issues (Fixed)

### 6. Rate Limiting
**Status:** Implemented

**Problem:** No rate limiting allowed abuse of expensive AI API calls.

**Solution:**
- Created [lib/rate-limit.ts](../lib/rate-limit.ts) with in-memory rate limiter
- Applied to chat (30/min), agent (20/min), API keys (10/min)
- Returns 429 with Retry-After header when exceeded

**Note:** For production at scale, consider Vercel KV or Upstash Redis.

---

### 7. Authentication Required for Chat
**Status:** Implemented

**Problem:** `/api/chat` allowed unauthenticated access to system API keys.

**Solution:** Added authentication check that returns 401 for unauthenticated requests.

**File:** [app/api/chat/route.ts](../app/api/chat/route.ts)

---

### 8. Skill Template Input Sanitization
**Status:** Implemented

**Problem:** User input directly interpolated into prompt templates without validation.

**Solution:**
- Added `MAX_INPUT_LENGTH` (100KB) to prevent DoS
- Added `isValidPlaceholderKey()` to validate placeholder names
- Invalid keys are skipped with warning

**File:** [lib/skills/to-anthropic-tools.ts](../lib/skills/to-anthropic-tools.ts)

---

## Files Modified

| File | Changes |
|------|---------|
| `lib/crypto/api-key-encryption.ts` | New - AES-GCM encryption |
| `lib/rate-limit.ts` | New - Rate limiting |
| `app/api/user/api-keys/route.ts` | New - Server-side key encryption |
| `app/api/chat/route.ts` | Auth required, decryption, rate limiting |
| `app/api/roles/[roleId]/agent/route.ts` | Fixed env mutation, decryption, rate limiting |
| `app/api/roles/[roleId]/chat/route.ts` | Added decryption |
| `components/settings/api-keys-settings.tsx` | Use server API for encryption |
| `lib/agent/tool-permissions.ts` | Dangerous tool validation, improved patterns |
| `lib/agent/mcp-resolver.ts` | Env var whitelist |
| `lib/skills/to-anthropic-tools.ts` | Input sanitization |

---

## Environment Variables Required

```bash
# Required for API key encryption
ENCRYPTION_MASTER_KEY=<32+ character secret>

# Existing - AI providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Testing Recommendations

- [ ] Test encryption/decryption roundtrip
- [ ] Test rate limit 429 responses
- [ ] Test dangerous tool + bypassPermissions is blocked
- [ ] Test MCP env var whitelist blocks sensitive vars
- [ ] Test template input length truncation
