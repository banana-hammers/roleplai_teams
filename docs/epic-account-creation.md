# Epic: Account Creation & Identity Alias

**Goal**: Create an engaging, AI-native sign-up flow where users discover their personality through conversation with an AI interviewer, establishing their foundational identity core that powers all their AI agents.

**Priority**: High | **Status**: Core Flow Complete (Stories 1.1-1.5, 1.7-1.8 ✓) | **Phase**: 3

**Note**: Stories 1.6 (Tension Detection) and 1.9 (Polish/Animations) are optional enhancements for future iterations.

---

## Overview

This epic transforms traditional sign-up into an **AI-powered personality discovery experience**. Users don't just create an "account" - they craft an **alias** and define their **identity core** through a conversational interview with an AI, then immediately test-drive their new identity to validate it feels right.

**What makes this AI-unique:**

- Conversational personality interview instead of static forms
- Instant validation with test-drive chat before completion
- Transparent behavior examples showing how choices affect AI responses
- AI-detected personality tensions with explanations
- Progressive boundary discovery that evolves with usage

### Key Principles

- **Conversational, not transactional**: AI interviews user about their personality
- **Instant validation**: Test-drive identity immediately to prove it works
- **Transparent impact**: Show concrete examples of how choices affect behavior
- **Fast to value**: 6-step flow completable in <2 minutes, but feels thoughtful
- **Adaptive intelligence**: AI asks follow-ups based on user's answers
- **Editable later**: Users can refine their identity core in settings after onboarding
- **Clear conceptual model**: Bridge from identity (core you) → role (specific use case)

---

## User Stories

**New 5-step flow:**

1. **Sign Up** (email/password) → Story 1.1
2. **Choose Alias** (unique username) → Story 1.2
3. **AI Interview** (5-7 conversational questions) → Story 1.3
4. **Identity Preview** (see your profile + behavior examples + tensions) → Story 1.4
5. **Test Drive** (chat with your identity, validate it feels right) → Story 1.5
6. **Completion** (save to DB, explain identity vs roles) → Story 1.7

**Supporting Stories:**

- State tracking (Story 1.8) - Simplified to localStorage + DB completion flag
- Polish & delight (Story 1.9) - Animations, micro-copy, confetti

---

### Story 1.1: Email/Password Sign-Up

**As a new user, I want to sign up with email and password so I can create my account**

**Acceptance Criteria**:

- [x] Create sign-up form with email, password, confirm password fields
- [x] Integrate Supabase Auth signup (email/password provider)
- [x] Validate email format and password strength (min 8 chars, 1 number, 1 special)
- [x] Create profile record automatically on successful signup
- [x] Handle and display auth errors (duplicate email, weak password, etc.)
- [x] Redirect to alias creation wizard on success

**Files**: `app/signup/page.tsx`, `app/actions/auth.ts`, `lib/supabase/client.ts`

**Notes**: Use server actions for form submission; session handled by proxy.ts middleware

---

### Story 1.2: Alias Name Selection

**As a new user, I want to choose a unique alias name that represents my account identity**

**Acceptance Criteria**:

- [x] Create wizard component with progress indicator
- [x] Step 1: Choose alias name (3-20 chars, alphanumeric + underscores)
- [x] Real-time validation with helpful feedback (too short, invalid chars, etc.)
- [x] Check alias uniqueness against database (add `alias` column to `profiles`)
- [x] Show availability indicator (✓ Available / ✗ Taken)
- [x] If alias taken, show AI-generated suggestions (e.g., append `_ai`, `_dev`, etc.)
- [x] Allow back/forward navigation between steps
- [ ] Save alias to `profiles` table (will be saved when moving to next step)

**Files**: `components/onboarding/alias-name.tsx`, `app/onboarding/page.tsx`, `lib/validation/alias.ts`, `app/api/check-alias/route.ts`

**Notes**: Keep it simple - just name validation, personality comes in next steps

**Micro-copy**: "Every great identity starts with a name. What should we call you?"

---

### Story 1.3: AI Personality Interview

**As a new user, I want to discover my personality through a conversation with an AI so the process feels engaging and natural**

**Acceptance Criteria**:

- [x] Step 2: Launch AI personality interview in chat-like interface
- [x] Display friendly AI avatar/name (e.g., "Nova, your onboarding guide")
- [x] AI asks 5-7 conversational questions about communication style, values, and boundaries
- [x] Questions adapt based on user's previous answers (branching logic)
- [x] Accept natural language responses (not just multiple choice)
- [x] Parse responses using AI to extract personality traits
- [x] Show progress indicator (e.g., "Question 3 of 7")
- [ ] Allow users to edit previous answers (deferred - not critical for MVP)
- [x] Store extracted traits in temporary state (voice keywords, priorities, boundaries)
- [x] Gracefully handle unclear responses with follow-up questions

**Files**: `components/onboarding/ai-interview.tsx`, `app/api/onboarding/interview/route.ts`, `lib/ai/personality-parser.ts`, `lib/constants/interview-prompts.ts`

**Interview Flow Example**:

```
AI: "Hey! I'm Nova. I'm here to help you create your AI identity. Let's start with the basics - how do you like to communicate? Are you more of a 'just the facts' person, or do you like to add some color commentary?"

User: "I like to get to the point, but I don't want to come across as rude"

AI: "Got it - direct but respectful. That makes sense! Now, tell me about what matters most to you when making decisions. Is it accuracy, creativity, efficiency... or something else?"

User: "Definitely accuracy. I hate when people make stuff up."

AI: "Perfect - accuracy is your priority. That means I'll always cite sources and admit when I don't know something. Speaking of which, what are your hard lines? Things you'd never want me to do?"

User: "Don't speculate or assume things about me"

AI: "Clear boundaries - I like it. [Continue with 2-3 more questions...]"
```

**AI Parsing Logic**:

- Extract communication style keywords → map to predefined voices
- Extract value words → map to priorities JSONB
- Extract boundary statements → map to boundaries JSONB
- Use structured output (tool calling) to ensure consistent format

**Technical Implementation**:

```typescript
// Interview system prompt
const INTERVIEW_SYSTEM = `You are Nova, a friendly onboarding guide helping users discover their AI personality.
Ask 5-7 conversational questions to understand:
1. Communication style (direct, warm, analytical, playful, calm, energetic)
2. Core values (accuracy, creativity, efficiency, empathy, logic, growth)
3. Boundaries (no speculation, admit uncertainty, respect privacy, etc.)

After each response, extract personality traits and ask follow-up questions.
Be conversational, not clinical. Make it feel like chatting with a friend.`;

// Structured output for parsing
interface PersonalityExtraction {
  voice: string; // "direct_respectful", "warm_conversational", etc.
  priorities: string[]; // ["accuracy", "logic", "growth"]
  boundaries: string[]; // ["no_speculation", "admit_uncertainty"]
  confidence: number; // 0-100, how confident in the extraction
}
```

**Micro-copy**: "Let's chat! I'll ask you a few questions to understand your personality."

---

### Story 1.4: Generate Identity Core with Behavior Examples

**As a new user, I want my identity core auto-generated from my personality interview and see concrete examples of how it affects behavior**

**Acceptance Criteria**:

- [x] Step 3: Generate identity core from AI interview extraction
- [x] Map communication style to descriptive `voice` field (TEXT)
- [x] Transform extracted priorities into `priorities` JSONB
- [x] Transform extracted boundaries into `boundaries` JSONB
- [x] Generate `decision_rules` JSONB based on priorities and boundaries
- [x] **Show concrete behavior examples** for each trait
- [x] Display summary card: "Your Identity Profile" with voice, priorities, boundaries
- [x] Include 3-5 scenario examples showing how AI will respond
- [ ] Detect and highlight personality tensions with explanations (Story 1.6)
- [x] Allow "Edit" option to return to interview if user wants to adjust
- [x] Do NOT save to database yet (happens after test drive validation)

**Files**: `lib/onboarding/generate-identity.ts`, `app/actions/onboarding.ts`, `components/onboarding/identity-summary.tsx`, `lib/ai/behavior-examples.ts`

**Notes**: Users validate this in the test drive (Story 1.5) before finalizing

**Identity Generation Logic**:

```typescript
// Communication style maps to descriptive voice
const styleToVoice = {
  direct_concise:
    "Direct and concise. Gets to the point quickly without unnecessary elaboration.",
  direct_respectful:
    "Direct but respectful. Clear and efficient while maintaining warmth.",
  warm_conversational:
    "Warm and conversational. Friendly and approachable, like talking to a trusted friend.",
  analytical_precise:
    "Analytical and precise. Detailed, methodical, and evidence-based in communication.",
  playful_creative:
    "Playful and creative. Uses metaphors and thinks outside the box.",
  calm_thoughtful:
    "Calm and thoughtful. Measured and reflective, considering multiple perspectives.",
  energetic_enthusiastic:
    "Energetic and enthusiastic. Upbeat, motivating, and action-oriented.",
};

// Priorities with ranked importance
// Example: ["accuracy", "logic", "growth"]
// → { accuracy: "high", logic: "high", growth: "high", creativity: "medium", empathy: "medium", efficiency: "medium" }

// Boundaries as boolean flags + custom text
// Example: ["no_speculation", "admit_uncertainty", "Don't discuss politics"]
// → { no_speculation: true, admit_uncertainty: true, no_assumptions: false, custom: ["Don't discuss politics"] }

// Decision rules generated from priorities + boundaries
interface DecisionRules {
  when_uncertain: string; // e.g., "Always admit uncertainty and offer to research"
  information_handling: string; // e.g., "Prioritize accuracy over speed; cite sources"
  tone_approach: string; // e.g., "Be direct but maintain respect and empathy"
  ethical_guidelines: string[]; // Based on boundaries
}
```

**Behavior Examples Display**:

```typescript
// Generate 3-5 concrete examples based on identity
const examples = [
  {
    scenario: "You ask me a question I don't know the answer to",
    response:
      "Because you value **accuracy** and set the **admit uncertainty** boundary, I'll say: 'I don't know the answer to that, but I can help you research it. Would you like me to find reliable sources?'",
  },
  {
    scenario: "You're deciding between two options",
    response:
      "Your **direct** style and **logic** priority means I'll say: 'Here are the key facts for each option: [X vs Y]. Based on these, option A seems stronger because...'",
  },
  {
    scenario: "I notice something in your message",
    response:
      "Your **no assumptions** boundary means I won't guess your intent. Instead: 'I noticed you mentioned X. Could you clarify what you mean by that?'",
  },
];
```

**Micro-copy**: "Here's your identity! Let me show you how this translates to real conversations..."

---

### Story 1.5: Test Drive Your Identity

**As a new user, I want to test my identity in a practice conversation before finalizing it**

**Acceptance Criteria**:

- [x] Step 4: Launch mini chat interface after identity preview
- [x] User has 2-5 turns with AI using their newly-created identity
- [x] AI responds using the generated voice, priorities, and boundaries
- [x] Show helpful prompts: "Try asking me to explain something" or "Test my boundaries"
- [ ] Display side-by-side comparison (optional): "Your AI" vs "Generic AI" (deferred - not critical)
- [x] Include "This feels right ✓" button to proceed
- [x] Include "Let me adjust" button to return to interview
- [ ] If user adjusts, preserve test drive messages for comparison (state already preserved in localStorage)
- [ ] Save identity to `identity_cores` table only after user confirms (Story 1.7)
- [ ] Show loading state: "Creating your identity core..." (Story 1.7)

**Files**: `components/onboarding/test-drive.tsx`, `app/api/onboarding/test-drive/route.ts`, `lib/ai/identity-chat.ts`

**Notes**: This is the "aha moment" - user sees their personality in action before committing

**Test Drive UI**:

```
┌────────────────────────────────────────────┐
│ Test Drive: Chat with Your Identity       │
├────────────────────────────────────────────┤
│ Try asking me something to see if this    │
│ feels like you. Here are some ideas:      │
│                                            │
│ • "Explain quantum computing to me"       │
│ • "Should I learn Python or JavaScript?"  │
│ • "Tell me about your creator" (boundary) │
└────────────────────────────────────────────┘

[Chat interface appears below]

User: "Explain quantum computing to me"

AI (using identity): "I don't have deep expertise on quantum physics, but here's what I understand: quantum computing uses quantum bits (qubits) that can be both 0 and 1 simultaneously. This is called superposition. Would you like me to find some reliable sources that explain this better?"
[Shows: ✓ Admit uncertainty boundary ✓ Accuracy priority]

User: "This feels right!"

[✓ This feels right] [← Let me adjust]
```

**Technical Implementation**:

```typescript
// Test drive uses identity core values in system prompt
const testDrivePrompt = `You are a test version of the user's AI identity.

Voice: ${identityCore.voice}
Priorities: ${JSON.stringify(identityCore.priorities)}
Boundaries: ${JSON.stringify(identityCore.boundaries)}
Decision Rules: ${JSON.stringify(identityCore.decision_rules)}

Respond to the user's messages using this personality.
Be authentic to the voice and respect all boundaries.`;
```

**Micro-copy**: "Let's see how this feels! Ask me anything to test your new identity."

---

### Story 1.6: Personality Tension Detection

**As a new user, I want to be notified if my personality choices conflict so I understand how they'll be balanced**

**Acceptance Criteria**:

- [ ] Analyze personality traits after interview for potential tensions
- [ ] Detect common conflicts (e.g., "direct + empathy", "efficiency + accuracy")
- [ ] Show warning badge on identity summary: "⚠️ Personality Balance Note"
- [ ] Explain how the tension will be resolved in practice
- [ ] Display examples of balanced responses
- [ ] Allow user to acknowledge or adjust traits
- [ ] Don't block progression - tensions are informative, not errors

**Files**: `lib/ai/tension-detector.ts`, `components/onboarding/tension-warning.tsx`, `lib/constants/personality-tensions.ts`

**Notes**: This builds trust by being transparent about how conflicting values are handled

**Common Tensions**:

```typescript
const PERSONALITY_TENSIONS = [
  {
    traits: ["direct_concise", "empathy"],
    explanation:
      "You value both directness and empathy. This means I'll be clear and efficient, but I'll choose words carefully to maintain respect and understanding.",
    example:
      "Instead of 'That's wrong,' I'll say: 'I see a different perspective here. Let me explain why...'",
  },
  {
    traits: ["efficiency", "accuracy"],
    explanation:
      "You value both speed and accuracy. When these conflict, I'll prioritize accuracy and explain if something will take extra time to verify.",
    example:
      "If you ask for quick info on a complex topic: 'I can give you a fast overview now, or take 2 more minutes to verify the details. Which would you prefer?'",
  },
  {
    traits: ["playful_creative", "no_speculation"],
    explanation:
      "You like creative thinking but don't want speculation. I'll use metaphors and explore ideas, but I'll mark the difference between facts and hypotheticals.",
    example:
      "Think of it like a tree (metaphor) - but to be clear, I don't have data on whether this is accurate. Would you like me to research it?",
  },
];
```

**Tension Warning UI**:

```
┌────────────────────────────────────────────┐
│ ⚠️ Personality Balance Note                │
├────────────────────────────────────────────┤
│ You value both DIRECTNESS and EMPATHY.    │
│                                            │
│ How I'll balance this:                    │
│ • Be clear and efficient                  │
│ • Choose words that maintain respect      │
│ • Explain reasoning when delivering       │
│   difficult feedback                       │
│                                            │
│ Example: Instead of "That's wrong," I'll  │
│ say "I see a different perspective..."    │
│                                            │
│ [Got it ✓] [Adjust personality ←]         │
└────────────────────────────────────────────┘
```

**Micro-copy**: "I noticed some interesting balances in your personality. Here's how I'll handle them..."

---

### Story 1.7: Completion & Welcome

**As a new user, I want to complete my identity setup and understand the difference between identity and roles**

**Acceptance Criteria**:

- [x] Step 5: Display completion screen after test drive confirmation
- [x] Mark `onboarding_completed` as `true` in profiles table
- [x] Show success message: "🎉 Welcome, [AliasName]! Your identity is ready."
- [x] Display identity summary card with voice, priorities, boundaries
- [x] **Explain conceptual bridge**: "Your identity is your core personality. Now let's create your first role - a specific agent for a specific task."
- [x] Show 2-3 role examples (e.g., "Email Assistant", "Research Buddy", "Code Reviewer")
- [x] Button: "Create Your First Role" → redirects to role creation flow
- [ ] Optional: Confetti animation on completion (Story 1.9)
- [x] Save onboarding completion timestamp (automatic via DB default)

**Files**: `components/onboarding/completion.tsx`, `app/actions/onboarding.ts`, `components/ui/confetti.tsx`

**Notes**: This is the handoff to Role Creation epic; explain identity vs role clearly to avoid confusion

**Completion Screen Design**:

```
┌────────────────────────────────────────────┐
│ 🎉 Welcome, @ryan!                         │
│ Your identity is ready.                   │
├────────────────────────────────────────────┤
│                                            │
│ YOUR IDENTITY                              │
│ Voice: Direct but respectful              │
│ Values: Accuracy, Logic, Growth           │
│ Boundaries: No speculation, Admit unknowns│
│                                            │
│ ─────────────────────────────────────────  │
│                                            │
│ What's next?                               │
│                                            │
│ Your IDENTITY is your core personality    │
│ across all AI interactions.               │
│                                            │
│ Now create your first ROLE - a specific   │
│ AI agent for a specific task:             │
│                                            │
│ • Email Assistant (drafts emails)         │
│ • Research Buddy (gathers info)           │
│ • Code Reviewer (reviews PRs)             │
│                                            │
│ Each role uses your identity but adds     │
│ task-specific skills and context.         │
│                                            │
│ [Create Your First Role →]                │
└────────────────────────────────────────────┘
```

**Micro-copy**: "🎉 You did it! Your identity is ready. Now let's put it to work with your first role..."

---

### Story 1.8: Onboarding State Tracking (Simplified)

**As a system, I want to track onboarding completion so users can resume if interrupted**

**Acceptance Criteria**:

- [ ] Add `onboarding_completed` BOOLEAN column to `profiles` table
- [ ] Add `alias` TEXT column to `profiles` table (unique constraint)
- [ ] Use browser localStorage for ephemeral state during active session
- [ ] Only save to database on final completion (identity core + completion flag)
- [ ] Redirect incomplete users to onboarding on login (check `onboarding_completed`)
- [ ] If user closes browser mid-onboarding, restart from step 1 (acceptable UX for <2min flow)

**Files**: `supabase/migrations/`, `lib/supabase/middleware.ts`, `proxy.ts`, `lib/hooks/use-onboarding-state.ts`

**Notes**: Simplified approach - JSONB state complexity removed. Fast flow doesn't need granular resume.

**localStorage Schema** (ephemeral):

```typescript
interface OnboardingLocalState {
  currentStep: number; // 1-5
  aliasName?: string;
  interviewMessages?: Message[]; // AI interview chat history
  extractedPersonality?: {
    voice: string;
    priorities: string[];
    boundaries: string[];
  };
  testDriveMessages?: Message[]; // Test drive chat history
}
```

**Migration** (simplified):

```sql
ALTER TABLE profiles
  ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN alias TEXT UNIQUE;

-- Create index for alias lookups
CREATE INDEX idx_profiles_alias ON profiles(alias) WHERE alias IS NOT NULL;
```

**Redirect Logic**:

```typescript
// In proxy.ts or middleware
if (user && !user.onboarding_completed && !publicRoutes.includes(path)) {
  return redirect("/onboarding");
}
```

---

### Story 1.9: Delightful Welcome Experience & Polish

**As a new user, I want a delightful, polished experience so I feel excited to use the app**

**Acceptance Criteria**:

- [ ] Smooth transitions between wizard steps (fade/slide animations)
- [ ] Encouraging micro-copy throughout (see examples below)
- [ ] Progress indicator showing steps completed
- [ ] Celebrate completion with confetti animation
- [ ] Show personalized welcome message using alias name
- [ ] Loading states with personality (not just spinners)
- [ ] Keyboard navigation support (Enter to continue, Esc to go back)
- [ ] Mobile-responsive design for all onboarding steps

**Files**: `components/onboarding/welcome-celebration.tsx`, `components/ui/confetti.tsx`, `components/ui/progress-indicator.tsx`

**Notes**: Use framer-motion for animations; keep transitions fast (<300ms)

**Updated Micro-Copy Examples**:

- **Step 1 (Alias)**: "Every great identity starts with a name. What should we call you?"
- **Step 2 (AI Interview)**: "Let's chat! I'll ask you a few questions to understand your personality."
- **Step 3 (Identity Preview)**: "Here's your identity! Let me show you how this translates to real conversations..."
- **Step 4 (Test Drive)**: "Let's see how this feels! Ask me anything to test your new identity."
- **Step 5 (Completion)**: "🎉 You did it! Your identity is ready. Now let's put it to work with your first role..."

**Loading State Examples**:

```typescript
const loadingMessages = [
  "Analyzing your personality traits...",
  "Generating your unique voice...",
  "Balancing your priorities...",
  "Setting up your boundaries...",
  "Creating your identity core...",
  "Almost there...",
];
```

**Animation Notes**:

- Confetti: Use on final completion only (not every step)
- Step transitions: Fade out → fade in with slight slide
- Progress bar: Smooth fill animation, not jumps
- Button states: Subtle hover/press feedback

---

## Database Changes

### New Migration: Onboarding Support

**File**: `supabase/migrations/YYYYMMDD_add_onboarding_fields.sql`

```sql
-- Add onboarding tracking to profiles
ALTER TABLE profiles
  ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN alias TEXT UNIQUE;

-- Create index for alias lookups (for uniqueness check API)
CREATE INDEX idx_profiles_alias ON profiles(alias) WHERE alias IS NOT NULL;

-- Note: onboarding_state JSONB removed - using localStorage instead for ephemeral state
```

**Type Updates**:
After migration, regenerate types:

```bash
npx supabase gen types typescript --local > types/database.types.ts
```

---

## Dependencies

- **Supabase Auth**: Email/password provider must be enabled
- **AI SDK v5**: For conversational interview and test drive (`@ai-sdk/react`, `ai`)
- **Framer Motion**: For smooth animations (`npm install framer-motion`)
- **Confetti Library**: Use `canvas-confetti` for celebration
- **shadcn/ui components**: Progress, Card, Button, Form, Input, Label, Textarea
- **AI Provider**: Anthropic or OpenAI for interview parsing (structured output support)

---

## Out of Scope (Future Enhancements)

- Visual customization (avatars, color schemes, patterns) - Phase 4
- Social auth (Google, GitHub, etc.) - Phase 4
- Alias editing after creation - Phase 4
- Multiple identity cores per user - Phase 5
- Team/workspace accounts - Phase 6
- Voice/video personality interview - Phase 5
- Progressive boundary discovery after role creation - Phase 4
- A/B testing different interview flows - Post-launch
- Personality matching with pre-built role templates - Phase 4

---

## Success Metrics

### Quantitative Metrics

- **Time to completion**: < 2 minutes from signup to identity core created
- **Completion rate**: > 85% of users complete onboarding without dropoff
- **Test drive usage**: > 70% of users try test drive (vs skip)
- **Test drive validation rate**: > 80% confirm "This feels right" without adjustments
- **Identity edit rate**: < 20% of users edit identity core within first week (lower = good defaults)
- **Dropoff analysis**: Track abandonment per step (optimize highest dropoff)

### Qualitative Metrics (Post-Onboarding Survey)

- **AI Quality**: "How well does your AI match your personality?" (1-5 scale, target: avg 4+)
- **Experience Quality**: "Was the onboarding process enjoyable?" (1-5 scale, target: avg 4+)
- **Clarity**: "Do you understand the difference between identity and roles?" (Yes/No, target: >90% yes)
- **Sentiment**: Free text - "The interview felt natural" vs "Too many questions"

### A/B Testing Opportunities (Post-Launch)

- Interview question count: 5 vs 7 questions
- Test drive: Mandatory vs optional
- Tension warnings: Show vs hide by default

---

## Technical Implementation Notes

### AI Interview Architecture

**Endpoint**: `app/api/onboarding/interview/route.ts`

```typescript
// System prompt for Nova (the interviewer)
const NOVA_SYSTEM = `You are Nova, a friendly AI onboarding guide for RoleplayAI Teams.

Your job: Interview the user with 5-7 conversational questions to understand:
1. Communication style (direct, warm, analytical, playful, calm, energetic)
2. Core values (accuracy, creativity, efficiency, empathy, logic, growth)
3. Boundaries (no speculation, admit uncertainty, respect privacy, etc.)

Interview guidelines:
- Be conversational and warm, not clinical
- Ask follow-up questions based on their answers
- Use structured output (tool calling) to extract personality traits after each response
- Track progress: keep count of questions asked, conclude after 5-7 questions
- End interview: "Thanks! I have everything I need. Let me show you your identity..."

After each user response, call extract_personality_traits with your analysis.`

// Structured output schema
const personalityExtractionTool = {
  name: 'extract_personality_traits',
  description: 'Extract personality traits from user response',
  parameters: {
    type: 'object',
    properties: {
      voice: { type: 'string', enum: ['direct_concise', 'direct_respectful', 'warm_conversational', ...] },
      priorities: { type: 'array', items: { type: 'string' } },
      boundaries: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number', minimum: 0, maximum: 100 },
      questionsAsked: { type: 'number' }
    }
  }
}
```

**Interview Flow**:

1. User starts interview → Nova asks first question
2. User responds → Nova calls `extract_personality_traits` tool → Asks next question
3. After 5-7 questions → Nova concludes → Return final extraction
4. Frontend receives extraction → Proceeds to identity preview (Story 1.4)

### Test Drive Architecture

**Endpoint**: `app/api/onboarding/test-drive/route.ts`

```typescript
// Build system prompt from extracted personality
const buildTestDrivePrompt = (personality: ExtractedPersonality) => {
  return `You are a test version of this user's AI identity. Respond authentically to their personality.

Voice: ${personality.voice}
${
  personality.voice === "direct_respectful"
    ? "Be clear and efficient while maintaining warmth and respect."
    : ""
}

Priorities: ${personality.priorities.join(", ")}
${
  personality.priorities.includes("accuracy")
    ? "Always prioritize getting facts right. Cite sources when possible."
    : ""
}

Boundaries: ${personality.boundaries.join(", ")}
${
  personality.boundaries.includes("no_speculation")
    ? 'Never guess or make up information. Say "I don\'t know" when uncertain.'
    : ""
}

Decision Rules:
- When uncertain: Admit it and offer to research
- Information handling: ${
    personality.priorities.includes("accuracy")
      ? "Prioritize accuracy over speed"
      : "Balance speed and accuracy"
  }
- Tone: ${
    personality.voice.includes("warm")
      ? "Friendly and approachable"
      : "Professional and clear"
  }
`;
};
```

### Personality Tension Detection

**File**: `lib/ai/tension-detector.ts`

```typescript
export const detectTensions = (
  personality: ExtractedPersonality
): PersonalityTension[] => {
  const tensions: PersonalityTension[] = [];

  // Check for common conflicts
  if (
    personality.voice.includes("direct") &&
    personality.priorities.includes("empathy")
  ) {
    tensions.push({
      traits: ["direct", "empathy"],
      explanation: "You value both directness and empathy...",
      example:
        "Instead of 'That's wrong,' I'll say: 'I see a different perspective...'",
    });
  }

  if (
    personality.priorities.includes("efficiency") &&
    personality.priorities.includes("accuracy")
  ) {
    tensions.push({
      traits: ["efficiency", "accuracy"],
      explanation: "You value both speed and accuracy...",
      example: "I'll ask: 'Quick overview now, or 2 more minutes to verify?'",
    });
  }

  return tensions;
};
```

### State Management Pattern

```typescript
// lib/hooks/use-onboarding-state.ts
export const useOnboardingState = () => {
  const [state, setState] = useState<OnboardingLocalState>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("onboarding_state");
    return saved ? JSON.parse(saved) : { currentStep: 1 };
  });

  // Auto-save to localStorage on changes
  useEffect(() => {
    localStorage.setItem("onboarding_state", JSON.stringify(state));
  }, [state]);

  // Clear on completion
  const completeOnboarding = () => {
    localStorage.removeItem("onboarding_state");
  };

  return { state, setState, completeOnboarding };
};
```

---

## Implementation Summary

### ✅ Completed (Dec 14, 2024)

**Core Onboarding Flow** (Stories 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8):

1. **Sign-up** ([app/signup/page.tsx](app/signup/page.tsx))
   - Email/password authentication with validation
   - Supabase Auth integration
   - Profile auto-creation

2. **Alias Selection** ([components/onboarding/alias-name.tsx](components/onboarding/alias-name.tsx))
   - Real-time validation and uniqueness checking
   - AI-generated suggestions for taken aliases
   - Debounced API calls for performance

3. **AI Personality Interview** ([components/onboarding/ai-interview.tsx](components/onboarding/ai-interview.tsx))
   - Conversational 5-7 question interview with Nova
   - Streaming AI responses (Anthropic/OpenAI)
   - Structured personality extraction with confidence scoring
   - API: [app/api/onboarding/interview/route.ts](app/api/onboarding/interview/route.ts)
   - Extraction: [app/api/onboarding/extract-personality/route.ts](app/api/onboarding/extract-personality/route.ts)

4. **Identity Preview** ([components/onboarding/identity-summary.tsx](components/onboarding/identity-summary.tsx))
   - Auto-generated identity core from interview
   - 3-5 concrete behavior examples showing trait impact
   - Decision rules framework (when_uncertain, information_handling, tone)
   - Edit option to return to interview

5. **Test Drive** ([components/onboarding/test-drive.tsx](components/onboarding/test-drive.tsx))
   - Live chat with identity-powered AI
   - 5 suggested test prompts
   - Requires 2+ exchanges before confirmation
   - API: [app/api/onboarding/test-drive/route.ts](app/api/onboarding/test-drive/route.ts)

6. **Completion** ([components/onboarding/completion.tsx](components/onboarding/completion.tsx))
   - Identity core saved to database
   - Alias saved, `onboarding_completed` flag set
   - Clear explanation of Identity vs Role concept
   - Redirect to role creation (future epic)
   - Action: [app/actions/onboarding.ts](app/actions/onboarding.ts)

7. **State Management** ([lib/hooks/use-onboarding-state.ts](lib/hooks/use-onboarding-state.ts))
   - localStorage for ephemeral state during session
   - Database migration for `alias` and `onboarding_completed` fields
   - Migration: [supabase/migrations/20250114000000_add_onboarding_fields.sql](supabase/migrations/20250114000000_add_onboarding_fields.sql)

**Supporting Files**:
- Constants: [lib/constants/interview-prompts.ts](lib/constants/interview-prompts.ts)
- Identity generation: [lib/onboarding/generate-identity.ts](lib/onboarding/generate-identity.ts)
- Alias validation: [lib/validation/alias.ts](lib/validation/alias.ts)
- UI components: [components/ui/progress-indicator.tsx](components/ui/progress-indicator.tsx)
- Alias check API: [app/api/check-alias/route.ts](app/api/check-alias/route.ts)

### ⏭️ Deferred for Future Iterations

**Story 1.6: Personality Tension Detection**
- Detect and explain conflicts between traits (e.g., "direct + empathy")
- Show balanced examples of how tensions are resolved
- Not critical for MVP, can be added later

**Story 1.9: Polish & Delightful Animations**
- Confetti celebration on completion
- Smooth step transitions with framer-motion
- Advanced loading states
- Keyboard navigation shortcuts
- Can be incrementally improved

### 📊 Test Coverage Needed

- [ ] Sign-up flow with various validation errors
- [ ] Alias uniqueness checking edge cases
- [ ] AI interview with different personality types
- [ ] Identity generation for all voice/priority combinations
- [ ] Test drive with boundary violations
- [ ] Database save failures and rollback

---

## Related Epics

- **Epic: Role Creation & Management** (TBD) - Creating and managing AI agents (roles)
- **Epic: Chat History & Persistence** (docs/backlog.md) - Saves conversations after onboarding
- **Epic: User API Key Encryption** (docs/backlog.md) - Lets users BYO API keys later
- **Epic: Progressive Boundary Discovery** (TBD) - Suggests new boundaries based on usage patterns
