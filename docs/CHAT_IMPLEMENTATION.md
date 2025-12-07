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
  "model": "gpt-4-turbo-preview" | "claude-3-5-sonnet-20241022"
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
- Real-time streaming with `useChat` hook from `@ai-sdk/react` (Vercel AI SDK v5)
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
✅ **BYO API keys** - Database schema ready (encryption TODO)
✅ **Identity injection** - Role-specific chats use identity core
✅ **Context composition** - Combines identity + role + context packs
✅ **RLS security** - All database queries use row-level security
✅ **Error handling** - Graceful fallbacks and user-friendly errors

## 🚧 TODO Items

### Critical
1. **API Key Encryption** - Implement encryption/decryption for `user_api_keys.encrypted_key`
   - Use Supabase Vault or pgsodium extension
   - Update both chat endpoints to decrypt keys

2. **Authentication Flow** - Users currently redirected to /login
   - Need signup/login forms
   - Email + password or OAuth

### Nice to Have
3. **Tool/Function Calling** - Leverage Vercel AI SDK's tool support
   - Define tools in role configuration
   - Implement approval workflow for sensitive actions

4. **Chat History Persistence** - Save conversations to database
   - New table: `conversations` and `messages`
   - Load previous chats

5. **API Key Management UI** - Settings page to add/edit/delete API keys

6. **Spend Tracking** - Monitor API usage against `spend_limit`

7. **Task Creation from Chats** - Convert chat interactions to tracked tasks

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
- API keys stored encrypted (to be implemented)
- Role ownership verified before use

## Next Steps

1. **Implement API key encryption** (see [Database Schema](supabase/migrations/20250101000000_initial_schema.sql))
2. **Build authentication UI** (signup/login forms)
3. **Create role management pages** (CRUD for roles, identity cores, context packs)
4. **Add function calling** with approval workflow
5. **Build task tracking UI** to monitor agent actions

## Files Created

```
app/
  api/
    chat/
      route.ts                    # Base chat endpoint
    roles/
      [roleId]/
        chat/
          route.ts                # Role-specific chat endpoint
  chat/
    page.tsx                      # Chat demo page

components/
  chat/
    chat-interface.tsx            # Reusable chat UI component
```

## Migration to AI SDK v5

The project has been updated to use Vercel AI SDK v5. Key changes:

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
  "ai": "^5.0.108",
  "@ai-sdk/react": "^1.0.0",
  "@ai-sdk/anthropic": "^2.0.53",
  "@ai-sdk/openai": "^2.0.77"
}
```

## Resources

- [Vercel AI SDK v5 Docs](https://sdk.vercel.ai/docs)
- [@ai-sdk/react Package](https://www.npmjs.com/package/@ai-sdk/react)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)
