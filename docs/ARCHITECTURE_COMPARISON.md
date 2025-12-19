# Architecture Comparison: RoleplayAI Teams vs. Anthropic B2B Agent-Builder Best Practices

This document compares RoleplayAI Teams' current architecture against Anthropic's recommended patterns for building B2B agent-builder platforms on Claude.

**Reference**: "Building a B2B agent-builder platform on Claude: Architecture and best practices" (Anthropic, 2025)

**Last Updated**: December 2025 (post-Vercel optimization)

---

## Executive Summary

| Category | Alignment | Notes |
|----------|-----------|-------|
| Tool Use API | 85% | Strong foundation with built-in web tools |
| MCP Integration | N/A | Not supported on Vercel (serverless limitation) |
| Claude Skills | 95% | Exceeds recommendations |
| Agent Patterns | 75% | Agentic loop in chat endpoint |
| Prompt Engineering | 70% | Prompt caching implemented |
| **Multi-Tenant/Cost** | **70%** | **Prompt caching implemented (90% savings)** |
| Security | 90% | Excellent RLS and encryption |

**Overall**: Production-ready architecture optimized for Vercel serverless deployment.

---

## Architecture Decision: Vercel Serverless

RoleplayAI Teams is deployed on Vercel, which has specific constraints:

| Feature | Vercel Support | Our Solution |
|---------|---------------|--------------|
| Edge Runtime | ✅ Yes | All API routes use Edge |
| Child Processes | ❌ No | Direct Anthropic API (no SDK) |
| MCP Servers | ❌ No | Built-in web tools instead |
| Long-running Jobs | ❌ No | Streaming with agentic loop |

This means we use the **Direct Anthropic API** with custom tool implementations rather than the Claude Agent SDK.

---

## 1. Tool Use API

### Report Recommendations
- JSON Schema tools with name, description, input_schema
- `strict: true` for schema conformance
- Tool Runner SDK for execution loop

### Current Implementation
- ✅ Skills converted to Anthropic tool format via `lib/skills/to-anthropic-tools.ts`
- ✅ Built-in web tools via `lib/tools/builtin-tools.ts`
- ✅ Custom agentic loop in `app/api/roles/[roleId]/chat/route.ts`
- ⚠️ **Gap**: Not using `strict: true` for guaranteed schema conformance

### Built-in Tools
| Tool | Description | File |
|------|-------------|------|
| `web_search` | Search via Brave/Serper API | `lib/tools/web-search.ts` |
| `web_fetch` | Fetch and parse web pages | `lib/tools/web-fetch.ts` |

---

## 2. MCP Integration

### Report Recommendations
- Dynamic tool registration at runtime
- 100+ pre-built MCP servers

### Current Status: Not Supported

MCP requires spawning child processes, which is not possible on Vercel's serverless architecture.

**Alternative**: Built-in web tools (`web_search`, `web_fetch`) provide similar functionality for web-based research tasks.

**Future**: If full MCP is needed, deploy to a container platform (Railway, Fly.io, AWS ECS).

---

## 3. Claude Skills

### Report Recommendations
- SKILL.md format with YAML frontmatter
- Markdown-based for non-technical users
- Skills API for programmatic management

### Current Implementation
- ✅ Full SKILL.md generation via `lib/skills/skill-to-markdown.ts`
- ✅ Skills table with UI form → markdown generation
- ✅ Full CRUD via Supabase + `/api/skills/` routes
- 📋 **Future**: Natural language quick-create not implemented

### Beyond Report Recommendations
| Feature | Description |
|---------|-------------|
| Skill versioning | `parent_skill_id` enables forking/iteration |
| Per-role overrides | `role_skills` junction with `config_overrides` |
| Execution constraints | `tool_constraints` field for limits |
| Progressive disclosure | Examples array for few-shot learning |

---

## 4. Agent Architecture Patterns

### Report's Six Patterns

| Pattern | Description | Implementation |
|---------|-------------|----------------|
| Prompt Chaining | Sequential subtasks with gates | Not explicit |
| Routing | Classify inputs to handlers | Partial (model routing) |
| Parallelization | Concurrent operations | Not explicit |
| **Orchestrator-Workers** | Central coordinator + specialists | Via agentic loop |
| Evaluator-Optimizer | Iterative refinement | Not implemented |
| Autonomous agents | Full agentic loops | ✅ Chat endpoint |

### Report's Agent Loop
`Gather Context → Take Action → Verify Work → Repeat`

### Current Implementation
- ✅ Context gathering: System prompt composition
- ✅ Action taking: Tool execution in agentic loop
- ✅ Streaming: Real-time token streaming
- ⚠️ **Gap**: No built-in verification step (LLM-as-judge)

---

## 5. Prompt Engineering

### Report Recommendations
- `{{double brackets}}` for placeholders
- XML tags for structure
- Extended thinking triggers

### Current Implementation
- ✅ `{{placeholder}}` syntax in `prompt_template`
- ⚠️ **Gap**: No XML tags in system prompt composition
- 📋 **Future**: Not using thinking budget triggers

---

## 6. Multi-Tenant & Cost Optimization

### Report Recommendations

| Feature | Benefit | Status |
|---------|---------|--------|
| **Prompt Caching** | 90% cost reduction | ✅ Implemented |
| **Message Batching** | 50% discount | ❌ Not implemented |
| Streaming | Real-time responses | ✅ SSE in all endpoints |
| Workspaces per tenant | Isolation | ❌ Single-user only |

### Prompt Caching (Implemented)

System prompts now use cache control for 90% cost savings:

```typescript
// In app/api/roles/[roleId]/chat/route.ts
system: [
  {
    type: 'text',
    text: systemPrompt,
    cache_control: { type: 'ephemeral' }  // 90% savings
  }
],
```

---

## 7. Security & Isolation

### Report Recommendations
- Workspace isolation
- BYO API keys
- Rate limiting by tier

### Current Implementation
- ✅ **RLS Policies**: All tables enforce `auth.uid() = user_id`
- ✅ **API Key Encryption**: AES-256-GCM via `lib/crypto/api-key-encryption.ts`
- ✅ **Rate Limiting**: Per-user, in-memory
- ⚠️ **Gap**: Rate limiting not distributed across instances

---

## Priority Recommendations

### ✅ Completed

1. **Prompt Caching** - 90% cost reduction on repeated system prompts
2. **Web Tools** - `web_search` and `web_fetch` for research tasks
3. **Agentic Loop** - Automatic tool execution with streaming

### 🟡 Recommended

1. **Add `strict: true` to Tool Definitions**
   - File: `lib/skills/to-anthropic-tools.ts`
   - Impact: Guaranteed schema conformance

2. **XML Tags in Prompt Composition**
   - File: Chat endpoint system prompt
   - Impact: Better prompt parsing

3. **Message Batching API**
   - Create: `app/api/batch/route.ts`
   - Impact: 50% cost reduction on batch operations

### 🟢 Future

1. **Distributed Rate Limiting** (Redis)
2. **Teams/Workspaces** (organizations table)
3. **Full MCP Support** (requires container deployment)

---

## File References

| Topic | Files |
|-------|-------|
| Chat endpoint | `app/api/roles/[roleId]/chat/route.ts` |
| Web search tool | `lib/tools/web-search.ts` |
| Web fetch tool | `lib/tools/web-fetch.ts` |
| Built-in tools registry | `lib/tools/builtin-tools.ts` |
| Skill conversion | `lib/skills/to-anthropic-tools.ts` |
| Skill markdown | `lib/skills/skill-to-markdown.ts` |
| API key encryption | `lib/crypto/api-key-encryption.ts` |
