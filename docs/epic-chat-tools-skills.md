# Epic: Chat Tools & Skills - Web Tools Integration

## Summary

Enable RoleplAI roles with web research capabilities through built-in tools: web search (Brave/Serper API) and web fetch (URL content extraction). Uses direct Anthropic API with agentic loop for Vercel Edge deployment.

## Status: ✅ Complete

**Completed**: December 2025

## Motivation

RoleplAI's skill system provides prompt-template interpolation (`{{placeholder}}` → value). To enhance roles with research capabilities, we've added:

- **Web Search**: Search the internet via Brave Search or Serper API
- **Web Fetch**: Fetch and extract content from web pages
- **Agentic Loop**: Automatic tool execution with streaming
- **Prompt Caching**: 90% cost savings on repeated system prompts

## Architecture Decision

Initially planned to use Claude Agent SDK, but it requires spawning child processes which is incompatible with Vercel's serverless architecture. Instead, we implemented:

| Approach | Pros | Cons |
|----------|------|------|
| ~~Claude Agent SDK~~ | Full MCP, file ops, bash | ❌ Can't run on Vercel |
| **Direct Anthropic API** | ✅ Edge compatible, streaming | No MCP, limited tools |

---

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Chat UI)                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              /api/roles/[roleId]/chat (Edge Runtime)             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Anthropic API                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │ Built-in │  │  Custom  │  │ Agentic  │  │ Prompt  │ │   │
│  │  │Web Tools │  │  Skills  │  │   Loop   │  │ Caching │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │   Supabase  │ │ Brave/Serper│ │ Web Pages   │
        │  (roles,    │ │ Search API  │ │  (fetch)    │
        │   skills)   │ │             │ │             │
        └─────────────┘ └─────────────┘ └─────────────┘
```

### Key Components

#### 1. Chat Endpoint (`app/api/roles/[roleId]/chat/route.ts`)

Enhanced with tools and prompt caching:

```typescript
// Combine built-in tools with custom skills
const tools: Anthropic.Tool[] = [
  ...getAvailableBuiltinTools(),  // web_search, web_fetch
  ...skillTools.map(t => ({...}))  // custom skills
]

// Prompt caching for 90% cost savings
system: [
  {
    type: 'text',
    text: systemPrompt,
    cache_control: { type: 'ephemeral' }
  }
],

// Agentic loop: execute tools until no more calls
while (continueLoop) {
  const response = await anthropic.messages.create({...})
  // Process tool calls
  if (isBuiltinTool(tc.name)) {
    result = await executeBuiltinTool(tc.name, tc.input)
  } else {
    result = executeSkillTool(skill, tc.input)
  }
}
```

#### 2. Web Search Tool (`lib/tools/web-search.ts`)

Search the web using Brave Search or Serper API:

```typescript
export async function executeWebSearch(query: string, maxResults: number = 5) {
  // Try Brave Search first, then Serper
  if (process.env.BRAVE_API_KEY) {
    return braveSearch(query, maxResults)
  }
  if (process.env.SERPER_API_KEY) {
    return serperSearch(query, maxResults)
  }
}
```

#### 3. Web Fetch Tool (`lib/tools/web-fetch.ts`)

Fetch and extract content from URLs:

```typescript
export async function executeWebFetch(url: string) {
  const response = await fetch(url, {...})
  const html = await response.text()
  const { title, content } = extractTextFromHtml(html)
  return truncateContent(url, content, title)
}
```

#### 4. Built-in Tools Registry (`lib/tools/builtin-tools.ts`)

Register and execute tools:

```typescript
export function getBuiltinToolDefinitions(): Anthropic.Tool[] {
  return [
    { name: 'web_search', description: '...', input_schema: {...} },
    { name: 'web_fetch', description: '...', input_schema: {...} }
  ]
}

export async function executeBuiltinTool(name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'web_search': return formatSearchResults(await executeWebSearch(...))
    case 'web_fetch': return formatFetchResult(await executeWebFetch(...))
  }
}
```

---

## Files Created/Modified

### Created

| File | Purpose |
|------|---------|
| `lib/tools/web-search.ts` | Brave/Serper search integration |
| `lib/tools/web-fetch.ts` | URL fetching + HTML parsing |
| `lib/tools/builtin-tools.ts` | Tool registry + executor |

### Modified

| File | Changes |
|------|---------|
| `app/api/roles/[roleId]/chat/route.ts` | Added tools, agentic loop, prompt caching |
| `components/settings/tool-config-selector.tsx` | Simplified to web tools only |
| `CLAUDE.md` | Updated documentation |

### Removed (SDK not compatible with Vercel)

| File | Reason |
|------|--------|
| ~~`app/api/roles/[roleId]/agent/route.ts`~~ | SDK can't run on Vercel |
| ~~`lib/agent/*`~~ | SDK-specific code |
| ~~`@anthropic-ai/claude-agent-sdk`~~ | Dependency removed |

---

## Environment Variables

```bash
# Required for web search (choose one)
BRAVE_API_KEY=...      # https://brave.com/search/api/
# OR
SERPER_API_KEY=...     # https://serper.dev/
```

---

## What's Supported

| Feature | Status | Notes |
|---------|--------|-------|
| Web Search | ✅ | Via Brave or Serper API |
| Web Fetch | ✅ | Any HTTP/HTTPS URL |
| Custom Skills | ✅ | Template interpolation |
| Prompt Caching | ✅ | 90% cost savings |
| Streaming | ✅ | SSE with agentic loop |
| Identity Injection | ✅ | Full composition |

## What's NOT Supported (Vercel limitation)

| Feature | Reason |
|---------|--------|
| MCP Servers | Requires child processes |
| File Operations | No filesystem on Edge |
| Bash Commands | No shell on Edge |
| Session Resume | No persistent processes |

---

## Future Enhancements

If full agent capabilities are needed:
1. Deploy to container platform (Railway, Fly.io, AWS ECS)
2. Reinstall Claude Agent SDK
3. Restore agent endpoint with MCP support

---

## References

- [Anthropic Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Brave Search API](https://brave.com/search/api/)
- [Serper API](https://serper.dev/)
