# AI SDK v6 Patterns

This project uses **Vercel AI SDK v6**, which has breaking changes from v4.

## Package Split

React hooks moved from `ai/react` to `@ai-sdk/react`:
```typescript
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
```

## Transport-based Design

Must configure transport explicitly:
```typescript
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: { provider, model }
  })
})
```

## Message Structure

Messages use `parts` array instead of simple `content`:
```typescript
message.parts.map(part => part.type === 'text' ? part.text : null)
```

## Send API

Use `sendMessage({ text: "..." })` instead of `handleSubmit(e)`.

## Streaming Responses

```typescript
import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const result = streamText({
  model: anthropic('claude-sonnet-4-6'),
  messages: [
    { role: 'system', content: systemPrompt },
    ...userMessages
  ],
  temperature: 0.7,
})

return result.toTextStreamResponse()
```

## Two Chat Endpoints

1. **`app/api/chat/route.ts`** — Basic chat for testing, no identity injection, supports OpenAI + Anthropic
2. **`app/api/roles/[roleId]/chat/route.ts`** — Production role-based chat with:
   - Identity core + role + lore + skills + MCP tools
   - System prompt composition (see `lib/prompts/system-prompt-builder.ts`)
   - Prompt caching (90% cost savings)
   - Agentic loop for automatic tool execution
   - Built-in tools: `web_search`, `web_fetch`

## System Prompt Composition Order

1. Identity Core (voice, priorities, boundaries, decision rules)
2. Role Definition (name, description, instructions)
3. Identity Facets (role-specific personality adjustments)
4. Available Skills (from `role_skills` junction table)
5. Approval Policy (`always`, `never`, `smart`)
6. Lore (linked knowledge snippets)
