# Chat Streaming Implementation

## ✅ What's Been Implemented

### 1. API Routes

#### Base Chat Endpoint
**Location:** [app/api/chat/route.ts](app/api/chat/route.ts)

- Supports both OpenAI and Anthropic providers
- Authenticates users via Supabase
- Falls back to system API keys if user hasn't provided BYO keys
- Streaming responses using Vercel AI SDK

**Usage:**
```typescript
POST /api/chat
{
  "messages": [...],
  "provider": "openai" | "anthropic",
  "model": "gpt-5-nano" | "claude-haiku-4-5" | etc.
}
```

#### Role-Specific Chat Endpoint
**Location:** [app/api/roles/[roleId]/chat/route.ts](app/api/roles/[roleId]/chat/route.ts)

- Injects user's identity core into system prompt
- Loads role-specific instructions and settings
- Includes linked context packs
- Respects role's model preferences
- Full RLS protection - only role owners can use their roles

**System Prompt Composition:**
1. Identity Core (voice, priorities, boundaries, decision rules)
2. Role definition (name, description, instructions)
3. Identity facets specific to the role
4. Allowed tools
5. Approval policy
6. Context packs (bio, brand, rules, custom)

**Usage:**
```typescript
POST /api/roles/{roleId}/chat
{
  "messages": [...]
}
```

### 2. UI Components

#### ChatInterface Component
**Location:** [components/chat/chat-interface.tsx](components/chat/chat-interface.tsx)

Features:
- Real-time streaming with `useChat` hook from `@ai-sdk/react` (Vercel AI SDK v6)
- Uses `DefaultChatTransport` from `ai` package for HTTP streaming
- Message history display with parts-based rendering
- Loading states with animated indicators
- Error handling and display
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)
- Provider/model badges
- Responsive design with Tailwind CSS

Props:
```typescript
interface ChatInterfaceProps {
  roleId?: string        // If provided, uses role-specific endpoint
  provider?: 'openai' | 'anthropic'
  model?: string
  roleName?: string      // Display name for the role
}
```

Implementation Notes:
- Uses new AI SDK v5 API: `sendMessage({ text: "..." })` instead of old `handleSubmit`
- Messages use `parts` array instead of simple `content` string
- Status states: 'ready', 'streaming', 'submitted', 'error'

#### Chat Demo Page
**Location:** [app/chat/page.tsx](app/chat/page.tsx)

- Tabbed interface to test both OpenAI and Anthropic
- Full-height responsive layout
- Easy testing without authentication (will need auth in production)

### 3. Features

✅ **Streaming responses** - Real-time token-by-token streaming
✅ **Multi-provider support** - OpenAI and Anthropic
✅ **BYO API keys** - AES-256-GCM encryption with PBKDF2 key derivation
✅ **Identity injection** - Role-specific chats use identity core
✅ **Context composition** - Combines identity + role + context packs
✅ **RLS security** - All database queries use row-level security
✅ **Error handling** - Graceful fallbacks and user-friendly errors
✅ **Web tools** - Built-in web search and web fetch capabilities
✅ **Prompt caching** - 90% cost savings on repeated system prompts
✅ **Rate limiting** - 30 requests/minute per user
✅ **Agentic loop** - Automatic tool execution with streaming

### 4. Web Tools

**Location:** [lib/tools/](lib/tools/)

| Tool | Description | API Provider |
|------|-------------|--------------|
| `web_search` | Search the web for information | Brave Search or Serper |
| `web_fetch` | Fetch and extract content from URLs | Built-in |
| `mcp_*` | External tools from MCP servers | User-hosted SSE servers |

**How it works:**
1. Role chat endpoint combines built-in tools with custom skills
2. Anthropic API called with tools array
3. If response contains `tool_use` blocks, execute tools server-side
4. Loop continues until no more tool calls
5. Final text response streamed to client

**Files:**
- [lib/tools/web-search.ts](lib/tools/web-search.ts) - Brave/Serper search integration
- [lib/tools/web-fetch.ts](lib/tools/web-fetch.ts) - URL fetching + HTML parsing
- [lib/tools/builtin-tools.ts](lib/tools/builtin-tools.ts) - Tool registry + executor
- [lib/tools/mcp-tools.ts](lib/tools/mcp-tools.ts) - MCP tool integration
- [lib/mcp/client.ts](lib/mcp/client.ts) - Edge-compatible MCP SSE client

## 🚧 TODO Items

### Nice to Have
1. **Spend Tracking** - Monitor API usage against `spend_limit`

2. **Task Creation from Chats** - Convert chat interactions to tracked tasks

## Testing

### Test Basic Chat
1. Visit http://localhost:3000
2. Click "Try Chat Demo"
3. Select OpenAI or Anthropic tab
4. Send a message

**Note:** You need valid API keys in `.env.local`:
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Test Role-Specific Chat (After Auth)
1. Create an identity core in the database
2. Create a role linked to your user
3. Optionally add context packs and link them to the role
4. Navigate to `/api/roles/{roleId}/chat`
5. The system prompt will include your identity + role context

## Architecture Notes

### Why Edge Runtime?
Both API routes use `export const runtime = 'edge'`:
- Lower latency for streaming responses
- Better scalability
- Cost-effective for high-traffic scenarios

### Why Separate Endpoints?
- `/api/chat` - General purpose, quick testing
- `/api/roles/[roleId]/chat` - Full identity injection, production use

### Security Model
- User authentication via Supabase Auth
- RLS policies enforce data isolation
- API keys encrypted with AES-256-GCM (PBKDF2 key derivation)
- Role ownership verified before use
- Rate limiting (30 req/min per user)

## Next Steps

1. ~~Implement API key encryption~~ ✅ Complete
2. ~~Build authentication UI~~ ✅ Complete
3. ~~Create role management pages~~ ✅ Complete
4. ~~Add web tools~~ ✅ Complete (web_search, web_fetch)
5. ~~Chat history persistence~~ ✅ Complete (conversations + messages tables)
6. **Spend tracking** - Monitor API usage against spend limits

## Files Created

```
app/
  api/
    chat/
      route.ts                    # Base chat endpoint
    roles/
      [roleId]/
        chat/
          route.ts                # Role-specific chat endpoint (with tools)
  chat/
    page.tsx                      # Chat demo page

components/
  chat/
    chat-interface.tsx            # Reusable chat UI component

lib/
  tools/
    builtin-tools.ts              # Tool registry + executor
    web-search.ts                 # Brave/Serper search integration
    web-fetch.ts                  # URL fetching + HTML parsing
  crypto/
    api-key-encryption.ts         # AES-256-GCM encryption
  rate-limit.ts                   # In-memory rate limiter
```

## Migration to AI SDK v6

The project uses Vercel AI SDK v6. Key changes from v4:

### Breaking Changes
1. **Package Split**: React hooks moved from `ai/react` to `@ai-sdk/react`
   ```typescript
   // Old (v4)
   import { useChat } from 'ai/react'

   // New (v5)
   import { useChat } from '@ai-sdk/react'
   import { DefaultChatTransport } from 'ai'
   ```

2. **Transport-based Architecture**: Must configure transport explicitly
   ```typescript
   const { messages, sendMessage, status } = useChat({
     transport: new DefaultChatTransport({
       api: endpoint,
       body: { provider, model }
     })
   })
   ```

3. **Message Structure**: Messages now have `parts` array
   ```typescript
   // Old
   message.content

   // New
   message.parts.map(part => part.type === 'text' ? part.text : null)
   ```

4. **Send API**: Different method signature
   ```typescript
   // Old
   handleSubmit(e)

   // New
   sendMessage({ text: inputValue })
   ```

### Dependencies
```json
{
  "ai": "^6.0.116",
  "@ai-sdk/react": "^3.0.118",
  "@ai-sdk/anthropic": "^3.0.58",
  "@ai-sdk/openai": "^3.0.41"
}
```

## Resources

- [Vercel AI SDK v5 Docs](https://sdk.vercel.ai/docs)
- [@ai-sdk/react Package](https://www.npmjs.com/package/@ai-sdk/react)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)
