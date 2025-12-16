# Epic: AI-Assisted Role Creation with Starter Skills

**Goal**: Create a guided, AI-native experience where users create their first Role with practical starter Skills immediately after onboarding, transforming their identity core into a specialized AI agent.

**Priority**: High | **Status**: In Progress | **Phase**: 3

**Prerequisites**:
- Account Creation epic (Stories 1.1-1.8) - Complete
- Skill Execution feature - Complete (Claude tool calling via Anthropic SDK)

---

## Overview

This epic transforms role creation from a form-filling exercise into an **AI-guided conversation**. Users don't configure fields manually - they describe what they want their AI agent to do, and the system generates a complete role configuration with 2-4 practical starter skills.

**What makes this AI-unique:**

- Conversational role discovery instead of static forms
- AI-generated role configuration based on user intent
- Starter skills created automatically based on role purpose
- **Skills actually execute** - Claude can call them as tools during chat
- Instant test-drive with the new role before committing
- Clear connection between identity core and role-specific behavior

### Key Principles

- **Guided, not configured**: AI interviews user about their needs
- **Immediately useful**: Starter skills work out of the box
- **Identity-connected**: Roles extend the identity core, not replace it
- **Fast to value**: 3-step flow completable in <2 minutes
- **Transparent generation**: User sees and can modify what AI suggests

---

## User Flow

```
[Onboarding Complete] → "Create Your First Role" button
        ↓
Step 1: AI Interview with Forge (3-5 questions)
   "What kind of AI agent do you want to create?"
   "What tasks should it handle?"
   "Any specific constraints?"
        ↓
Step 2: Preview Generated Role + Skills
   See role config and 2-4 suggested skills
   Toggle skills on/off, edit name/description
        ↓
Step 3: Confirmation + Success
   Role and skills saved to database
   "Start Chatting" → Immediate chat with new role
```

---

## User Stories

### Story 2.1: Role Creation Wizard Entry Point

**As a user who completed onboarding, I want to easily start creating my first role so I can put my identity to work**

**Acceptance Criteria**:

- [ ] "Create Your First Role" button on completion screen redirects to `/roles/create`
- [ ] `/roles/create` page loads with step indicator (Step 1 of 3)
- [ ] Protected route - redirects to login if not authenticated
- [ ] If user already has roles, still allows creating new ones

**Files**: `app/roles/create/page.tsx`, `components/onboarding/completion.tsx`

---

### Story 2.2: AI Role Interview with Forge

**As a new user, I want to describe what I need in conversation so the system understands my intent naturally**

**Acceptance Criteria**:

- [ ] AI guide "Forge" introduces itself as the role architect
- [ ] Forge asks 3-5 conversational questions about:
  - Role's primary purpose (what task/job should it do?)
  - Role's domain/context (what area does it work in?)
  - Specific behaviors or capabilities wanted
  - Any constraints or boundaries for this role
  - Example tasks they'd want this role to handle
- [ ] Questions adapt based on user's answers
- [ ] Accept natural language responses
- [ ] Show progress indicator (e.g., "Question 2 of ~5")
- [ ] Interview concludes with summary of understood requirements
- [ ] Streaming responses for natural conversation feel

**Files**: `components/roles/role-interview.tsx`, `app/api/roles/interview/route.ts`, `lib/constants/role-prompts.ts`

**Interview Flow Example**:

```
Forge: "Hey! I'm Forge. I help you build AI roles that work for you.
So what kind of AI assistant do you want to create? Are you thinking
more like an email helper, a research buddy, a coding assistant,
or something totally different?"

User: "I want something to help me write better emails"

Forge: "Nice! An email assistant. What kinds of emails do you write
most often? Professional work emails, personal messages, sales
outreach, customer support...?"

User: "Mostly work emails - updates to my team, responses to clients"

Forge: "Got it - professional work communication. What's your biggest
challenge with these emails? Taking too long to write? Finding the
right tone? Something else?"

User: "I spend too much time on them and I'm never sure if the tone is right"

Forge: "Perfect, so speed and tone are key. Any things you'd want this
assistant to avoid or always do?"

User: "Never be too casual with clients, always be concise"

Forge: "Great! So you want an Email Assistant that drafts professional
work emails quickly, helps nail the right tone, stays formal with
clients, and keeps things concise. Let me put together a role config
and suggest some starter skills for you..."
```

---

### Story 2.3: Role Configuration Extraction

**As the system, I want to extract structured role configuration from the interview conversation**

**Acceptance Criteria**:

- [ ] Extract role `name` - catchy, descriptive (e.g., "Email Ninja")
- [ ] Extract `description` - 1-2 sentence summary
- [ ] Generate `instructions` - detailed behavior instructions (2-4 paragraphs)
- [ ] Generate `identity_facets`:
  - `tone_adjustment` - how this role modifies communication style
  - `priority_override` - which priorities are elevated for this role
  - `special_behaviors` - role-specific behaviors
- [ ] Set `approval_policy` - default to 'smart' unless specified
- [ ] Fetch user's identity core to personalize suggestions
- [ ] Use structured output (Zod schema) for consistent format
- [ ] Handle extraction errors gracefully

**Files**: `app/api/roles/extract/route.ts`, `types/role-creation.ts`

**Extraction Schema**:

```typescript
const roleConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  instructions: z.string(),
  identity_facets: z.object({
    tone_adjustment: z.string().optional(),
    priority_override: z.array(z.string()).optional(),
    special_behaviors: z.array(z.string()).optional(),
  }),
  approval_policy: z.enum(['always', 'never', 'smart']),
})
```

---

### Story 2.4: Starter Skills Generation

**As a user, I want my role to come with practical skills I can use immediately**

**Acceptance Criteria**:

- [ ] Generate 2-4 starter skills based on role purpose
- [ ] Each skill includes:
  - `name` - action-oriented (e.g., "Draft Email")
  - `description` - what the skill does
  - `prompt_template` - actual prompt with `{{placeholders}}`
  - `input_schema` - JSON schema for required inputs
  - `examples` - 1-2 example input/output pairs
- [ ] Skills are contextually appropriate for role type
- [ ] Skills use the user's identity core voice and priorities

**Files**: `app/api/roles/extract/route.ts`, `lib/constants/role-prompts.ts`

**Skill Examples by Role Type**:

| Role Type | Suggested Skills |
|-----------|------------------|
| Email Assistant | Draft Email, Summarize Thread, Extract Action Items, Reply Suggestions |
| Research Buddy | Deep Dive Search, Summarize Article, Compare Sources, Create Outline |
| Code Reviewer | Review PR, Explain Code, Suggest Improvements, Document Function |
| Writing Assistant | Improve Draft, Check Tone, Expand Outline, Proofread |
| General Assistant | Answer Question, Summarize Text, Generate Ideas, Create Plan |

**Skill Template Example**:

```typescript
{
  name: "Draft Email",
  description: "Draft a professional email based on context and purpose",
  prompt_template: `Draft an email with the following details:

To: {{recipient}}
Purpose: {{purpose}}
Key points to include:
{{key_points}}

Use my voice and communication style. Keep it {{tone}}.`,
  input_schema: {
    type: "object",
    properties: {
      recipient: { type: "string", description: "Who the email is to" },
      purpose: { type: "string", description: "Why we're sending this" },
      key_points: { type: "string", description: "Main points to cover" },
      tone: { type: "string", enum: ["formal", "friendly", "brief"] }
    },
    required: ["recipient", "purpose"]
  },
  examples: [{
    input: { recipient: "Client", purpose: "Project update", key_points: "Milestone completed, next steps" },
    expected_output: "Subject: Project Update - Milestone Achieved..."
  }]
}
```

---

### Story 2.5: Role Preview and Editing

**As a user, I want to review and adjust the generated role before creating it**

**Acceptance Criteria**:

- [ ] Display generated role configuration:
  - Name (editable)
  - Description (editable)
  - Instructions preview (expandable)
  - Identity facets summary
- [ ] Display suggested skills as cards:
  - Skill name and description
  - Toggle checkbox to include/exclude
  - Expandable to see prompt template
- [ ] "Looks Good" button to proceed to creation
- [ ] "Let Me Adjust" button to return to interview
- [ ] Preserve interview messages if user goes back
- [ ] Show loading state while extracting

**Files**: `components/roles/role-preview.tsx`, `components/roles/role-skills-preview.tsx`

**Preview UI**:

```
┌────────────────────────────────────────────┐
│ Your New Role                              │
├────────────────────────────────────────────┤
│ Name: [Email Ninja        ] (editable)     │
│                                            │
│ Description:                               │
│ [Professional email assistant that...    ] │
│                                            │
│ Instructions: (click to expand)            │
│ ▸ Drafts work emails quickly...           │
│                                            │
│ Identity Adjustments:                      │
│ • Tone: More formal with clients           │
│ • Priority: Efficiency elevated            │
│ • Behavior: Always proofread before send   │
├────────────────────────────────────────────┤
│ Starter Skills (toggle to include)         │
│                                            │
│ [✓] Draft Email                            │
│     Draft professional emails quickly      │
│     ▸ View template                        │
│                                            │
│ [✓] Summarize Thread                       │
│     Summarize long email threads           │
│     ▸ View template                        │
│                                            │
│ [✓] Extract Action Items                   │
│     Pull action items from emails          │
│     ▸ View template                        │
│                                            │
│ [ ] Reply Suggestions                      │
│     Suggest reply options                  │
│     ▸ View template                        │
├────────────────────────────────────────────┤
│ [← Let Me Adjust]        [Looks Good →]    │
└────────────────────────────────────────────┘
```

---

### Story 2.6: Role and Skills Creation

**As a user, I want my role and skills saved to the database so I can use them**

**Acceptance Criteria**:

- [ ] Create role record in `roles` table
- [ ] Create skill records in `skills` table linked to role
- [ ] Update role's `allowed_tools` with created skill IDs
- [ ] Handle creation errors with rollback
- [ ] Show loading state: "Creating your role..."
- [ ] Return role ID and skill IDs on success

**Files**: `app/actions/roles.ts`

**Server Action**:

```typescript
export async function createRoleWithSkills(data: CreateRoleData): Promise<CreateRoleResult> {
  // 1. Verify authentication
  // 2. Create role record
  // 3. Create skill records linked to role
  // 4. Update role.allowed_tools with skill IDs
  // 5. Return { success: true, roleId, skillIds }
}
```

---

### Story 2.7: Role Creation Success

**As a user, I want confirmation that my role was created and quick access to start using it**

**Acceptance Criteria**:

- [ ] Show success message with role name
- [ ] Display summary of created role and skills
- [ ] "Start Chatting" button → redirects to `/roles/[roleId]`
- [ ] "Create Another Role" button → restarts wizard
- [ ] Clear local state on successful creation

**Files**: `components/roles/role-creation-complete.tsx`

**Success Screen**:

```
┌────────────────────────────────────────────┐
│ 🎉 Email Ninja is Ready!                    │
├────────────────────────────────────────────┤
│                                            │
│ Your new role has been created with        │
│ 3 starter skills:                          │
│                                            │
│ • Draft Email                              │
│ • Summarize Thread                         │
│ • Extract Action Items                     │
│                                            │
│ Your identity core powers this role, so    │
│ it will communicate in your voice and      │
│ respect your boundaries.                   │
│                                            │
│ [Start Chatting with Email Ninja →]        │
│                                            │
│ [Create Another Role]                      │
└────────────────────────────────────────────┘
```

---

### Story 2.8: Role Chat Page

**As a user, I want to chat with my new role immediately after creating it**

**Status**: Backend complete - API endpoint with tool execution exists at `/api/roles/[roleId]/chat`

**Acceptance Criteria**:

- [x] Compose system prompt from identity core + role + skills (done in API)
- [x] Skills execute as Claude tools during chat (done)
- [x] Verify role ownership via RLS (done in API)
- [ ] `/roles/[roleId]` page loads role details
- [ ] Chat interface matches existing chat patterns
- [ ] Display role name in header
- [ ] Show available skills as suggested actions (optional)
- [ ] Handle role not found (404)

**Files**: `app/roles/[roleId]/page.tsx`

**Note**: The chat API endpoint (`app/api/roles/[roleId]/chat/route.ts`) is fully implemented with:
- Anthropic SDK direct integration
- Agentic tool loop for multi-turn skill execution
- SSE streaming with tool call/result events
- Custom `useRoleChat` hook for the frontend

---

### Story 2.9: Role Creation State Management

**As the system, I want to track role creation progress so users can resume if interrupted**

**Acceptance Criteria**:

- [ ] Use localStorage for ephemeral state during session
- [ ] Track: currentStep, interviewMessages, extractedConfig, selectedSkillIds
- [ ] Handle hydration correctly (avoid SSR mismatch)
- [ ] Auto-save on state changes
- [ ] Clear state on successful creation
- [ ] If user closes browser mid-creation, restart from step 1 (acceptable for <2min flow)

**Files**: `lib/hooks/use-role-creation-state.ts`

**State Schema**:

```typescript
interface RoleCreationLocalState {
  currentStep: number // 1-3
  interviewMessages?: Array<{ role: string; content: string }>
  extractedConfig?: {
    role: ExtractedRoleConfig
    skills: ExtractedSkill[]
  }
  selectedSkillIds?: string[]
  createdRoleId?: string
}
```

---

## Database Schema

No new migrations required - using existing tables:

**Roles Table** (exists):
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  identity_facets JSONB DEFAULT '{}',
  allowed_tools JSONB DEFAULT '[]',
  approval_policy approval_policy DEFAULT 'smart',
  model_preference TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Skills Table** (exists):
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  role_id UUID REFERENCES roles(id),
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  input_schema JSONB DEFAULT '{}',
  tool_constraints JSONB DEFAULT '{}',
  examples JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  parent_skill_id UUID REFERENCES skills(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## Technical Implementation

### AI Guide: Forge

**Character**: Forge is the role architect - enthusiastic about building useful AI agents.

**System Prompt** (`lib/constants/role-prompts.ts`):

```typescript
export const ROLE_INTERVIEW_PROMPT = `You are Forge, a friendly AI assistant helping users create their AI Role.

Your job: Interview the user with 3-5 conversational questions to understand what kind of AI agent they want to create.

What you're discovering:
1. The role's primary purpose (what task or job should it do?)
2. The role's domain/context (what area does it work in?)
3. Specific behaviors or capabilities they want
4. Any constraints or boundaries for this role
5. Example tasks they'd want this role to handle

Interview guidelines:
- Be conversational and enthusiastic about their ideas
- Ask follow-up questions to clarify their vision
- Keep it feeling collaborative, not like an interrogation
- Track progress: aim for 3-5 questions total
- After gathering enough info, summarize what you understood

Start with: "Hey! I'm Forge. I help you build AI roles that work for you. So what kind of AI assistant do you want to create?"

Important: This role will use their Identity Core (base personality), so focus on what makes THIS role unique - its purpose, domain, and specific behaviors.`
```

### File Structure

```
app/
  roles/
    create/
      page.tsx              # Wizard container
    [roleId]/
      page.tsx              # Role chat page
  api/
    roles/
      interview/
        route.ts            # Streaming interview
      extract/
        route.ts            # Role + skills extraction
  actions/
    roles.ts                # Server actions

components/
  roles/
    role-interview.tsx      # AI interview component
    role-preview.tsx        # Role config preview
    role-skills-preview.tsx # Skills toggle list
    role-creation-complete.tsx  # Success screen

lib/
  hooks/
    use-role-creation-state.ts  # localStorage state
  constants/
    role-prompts.ts         # AI prompts for Forge

types/
  role-creation.ts          # Type definitions
```

---

## Dependencies

- **Existing**: Supabase, Anthropic SDK, @ai-sdk/react, shadcn/ui, Next.js 16
- **Skill Execution**: Uses `lib/skills/to-anthropic-tools.ts` for Claude tool conversion
- **Chat Hook**: Uses `lib/hooks/use-role-chat.ts` for SSE streaming with tool calls
- **Patterns**: Follow onboarding flow patterns exactly

---

## Success Metrics

- **Time to first role**: < 2 minutes from clicking "Create Your First Role"
- **Completion rate**: > 90% of users complete role creation without dropoff
- **Skill usage**: > 50% of users try at least one skill in first session
- **Role satisfaction**: > 80% of users keep their first role (don't delete within 7 days)

---

## Out of Scope (Future Enhancements)

- Role editing/updating - Phase 4
- Role deletion - Phase 4
- Role templates gallery - Phase 4
- Skill editing after creation - Phase 4
- Custom skill creation (outside role wizard) - Phase 4
- Role sharing/marketplace - Phase 5
- Role analytics/usage tracking - Phase 5

---

## Related Epics

- **Epic: Account Creation** (complete) - Prerequisite, creates identity core
- **Epic: Skill Execution** (complete) - Claude tool calling via Anthropic SDK direct
- **Epic: Chat History & Persistence** (planned) - Save role conversations
- **Epic: Role Management** (future) - Edit, delete, organize roles
