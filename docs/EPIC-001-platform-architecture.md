# EPIC-001: Complete Agent Platform Architecture

**Status:** In Progress
**Created:** 2024-12-20
**Owner:** Ryan Eves

---

## Vision

Transform RoleplayAI Teams from a single-user AI identity platform into a production-ready B2B agent builder with persistent memory, team collaboration, and extensible tool integrations.

---

## Current State Scorecard

| Layer | Score | Status |
|-------|-------|--------|
| Agent Definition | 7/10 | Missing versioning, memory settings |
| Tool Orchestration | 8/10 | Solid, just needs MCP wiring |
| Memory System | 4/10 | Schema ready, no retrieval layer |
| Multi-Tenant | 5/10 | Good isolation, no teams/metering |
| Builder UI | 6/10 | Functional, lacks polish/versioning |

---

## Roadmap

```
Phase 1: Core Stability (Current)
├── EPIC-002: Chat History Persistence
├── EPIC-004: Usage Metering & Spend Limits
└── EPIC-008: Advanced Model Parameters

Phase 2: Power Features
├── EPIC-003: MCP Server Integration
├── EPIC-005: Persistent Memory (RAG)
└── EPIC-007: Role Version History

Phase 3: B2B Scale
├── EPIC-006: Team & Organization Support
├── Agent Marketplace
└── Enterprise SSO
```

---

## Feature Epics

### EPIC-002: Chat History Persistence
**Priority:** High | **Effort:** Low | **Status:** Not Started

#### User Story
As a user, I want my conversations with RoleplAIrs to be saved so I can continue where I left off and review past interactions.

#### Acceptance Criteria
- [ ] Messages persisted to `messages` table on send/receive
- [ ] Conversations created/resumed automatically
- [ ] Conversation list shows recent chats per role
- [ ] Chat loads previous messages on resume
- [ ] Title auto-generated from first message

#### Key Files
- `app/api/roles/[roleId]/chat/route.ts` - Wire up persistence
- `supabase/migrations/20250117000000_add_conversations_and_role_skills.sql` - Schema exists

---

### EPIC-003: MCP Server Integration
**Priority:** High | **Effort:** Medium | **Status:** Not Started

#### User Story
As a power user, I want to connect my own MCP servers to give my RoleplAIrs access to custom tools and data sources.

#### Acceptance Criteria
- [ ] MCP servers linked to roles fetched at chat start
- [ ] MCP tool definitions merged into tool list for Claude
- [ ] MCP tool calls routed to appropriate server
- [ ] Support for stdio, SSE, and HTTP transport types
- [ ] Built-in MCP servers work when enabled

#### Key Files
- `types/mcp.ts` - Types exist
- `components/settings/mcp-servers-settings.tsx` - UI exists
- `app/api/roles/[roleId]/chat/route.ts` - Connect MCP client

---

### EPIC-004: Usage Metering & Spend Limits
**Priority:** High | **Effort:** Medium | **Status:** Not Started

#### User Story
As a user with BYO API keys, I want to see my usage and set spending limits so I don't get unexpected bills.

#### Acceptance Criteria
- [ ] Token counts tracked per message (input/output)
- [ ] Daily/monthly usage aggregated per user
- [ ] Spend limits enforced (block requests when exceeded)
- [ ] Usage dashboard shows current spend vs. limit
- [ ] Email alerts at 80% and 100% of limit

#### Key Files
- `user_api_keys.spend_limit` - Column exists
- New: `usage_logs` table needed

---

### EPIC-005: Persistent Memory (RAG)
**Priority:** Medium | **Effort:** High | **Status:** Not Started

#### User Story
As a user, I want my RoleplAIrs to remember important facts about me across conversations so interactions feel continuous and personal.

#### Acceptance Criteria
- [ ] Key facts extracted from conversations automatically
- [ ] Facts stored with embeddings for semantic search
- [ ] Relevant memories retrieved at conversation start
- [ ] Users can view/edit/delete memories
- [ ] Per-role memory isolation option

#### Key Files
- New: Enable pgvector extension
- New: `memories` table with embedding column
- `app/api/roles/[roleId]/chat/route.ts` - Memory retrieval

---

### EPIC-006: Team & Organization Support
**Priority:** Medium | **Effort:** High | **Status:** Not Started

#### User Story
As a team admin, I want to invite team members and share RoleplAIrs across my organization with role-based permissions.

#### Acceptance Criteria
- [ ] Create organizations with billing owner
- [ ] Invite members via email
- [ ] Role-based permissions (admin, member, viewer)
- [ ] Shared agents visible to team members
- [ ] Organization-level API keys and limits
- [ ] Usage aggregation per organization

#### Key Files
- New: `organizations`, `organization_members`, `organization_invites` tables
- Modify RLS policies for team access

---

### EPIC-007: Role Version History
**Priority:** Medium | **Effort:** Medium | **Status:** Not Started

#### User Story
As a user, I want to see the history of changes to my RoleplAIrs and rollback to previous versions if needed.

#### Acceptance Criteria
- [ ] Snapshot saved on each role update
- [ ] Version list shows changes with timestamps
- [ ] Diff view between versions
- [ ] One-click rollback to any version

#### Key Files
- New: `role_versions` table with JSON snapshot
- `components/settings/role-settings-form.tsx` - Version UI

---

### EPIC-008: Advanced Model Parameters
**Priority:** Low | **Effort:** Low | **Status:** Not Started

#### User Story
As an advanced user, I want to fine-tune model parameters (temperature, max tokens, top_p) per RoleplAIr for better control over responses.

#### Acceptance Criteria
- [ ] Temperature slider (0-2) in role settings
- [ ] Max tokens input with model-specific limits
- [ ] Top P / Top K options for supported models
- [ ] Presets for common configurations

#### Key Files
- `roles` table - Add `temperature`, `max_tokens`, `top_p` columns
- `app/api/roles/[roleId]/chat/route.ts` - Apply in streamText()
- `components/settings/role-settings-form.tsx` - UI controls

---

## Architecture Reference

### Current Data Model
```
User
 ├── Identity Core (1:1)
 │    └── voice, priorities, boundaries, decision_rules
 │
 ├── Roles (1:many)
 │    ├── instructions, identity_facets, model_preference
 │    ├── role_skills → Skills (many:many)
 │    └── role_lore → Lore (many:many)
 │
 ├── Skills (1:many)
 │    └── prompt_template, input_schema
 │
 ├── Lore (1:many)
 │    └── content, type (bio/brand/rules/custom)
 │
 ├── Conversations (1:many) [schema ready]
 │    └── Messages (1:many)
 │
 └── User API Keys (1:many)
      └── encrypted_key, spend_limit
```

### Future Additions
```
User
 ├── Organization Memberships (many:many)
 ├── Memories (1:many) [new - RAG]
 └── Usage Logs (1:many) [new - metering]

Organization [new]
 ├── Members, Shared Roles, Team API Keys, Billing

Role
 └── Role Versions (1:many) [new - history]
```

---

## Key Technical Decisions

| Decision | Choice | Trade-off |
|----------|--------|-----------|
| Tool execution | Edge runtime (hosted) | Fast but limited compute |
| API proxying | All calls through backend | Full control, metering possible |
| Skill abstraction | Prompt templates | Simple but not full sub-agents |
| Auth storage | BYO keys encrypted (AES-256-GCM) | Good security, adds complexity |
| Multi-tenancy | Single-user RLS | Simple now, refactor for teams later |

---

## Progress Log

| Date | Update |
|------|--------|
| 2024-12-20 | Epic created, architecture analysis complete |
