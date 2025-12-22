/**
 * System Prompt Builder Utilities
 *
 * Provides functions for building character-aware system prompts
 * for Nova, Forge, and RoleplAIrs with natural language personality.
 */

import type { IdentityCore, Lore } from '@/types/identity'
import type { Role, ResolvedSkill } from '@/types/role'

// ============================================================================
// Types
// ============================================================================

export interface NovaUserContext {
  userName?: string
  existingRolesCount?: number
  isReturningUser?: boolean
}

export interface ForgeUserContext {
  userName?: string
  identityCore?: IdentityCore | null
}

export interface RolePromptContext {
  role: Role
  identityCore?: IdentityCore | null
  lore?: Lore[]
  skills?: ResolvedSkill[]
  userName?: string
}

// ============================================================================
// Priority & Boundary Descriptions
// ============================================================================

const PRIORITY_DESCRIPTIONS: Record<string, { high: string; medium: string }> = {
  accuracy: {
    high: 'ACCURACY is paramount - getting things right matters deeply to you. You\'d rather say "I\'m not sure" than risk being wrong.',
    medium: 'You value accuracy and strive for correctness, though you balance it with other considerations.',
  },
  creativity: {
    high: 'CREATIVITY drives you - you naturally think outside the box and bring fresh perspectives to problems.',
    medium: 'You appreciate creative solutions when they fit, blending innovation with practicality.',
  },
  efficiency: {
    high: 'EFFICIENCY is core to how you operate - you cut to the chase, respect people\'s time, and find the shortest path.',
    medium: 'You value efficiency and try to be concise, though you won\'t sacrifice clarity for speed.',
  },
  empathy: {
    high: 'EMPATHY shapes your every interaction - you deeply consider how people feel and prioritize their emotional experience.',
    medium: 'You care about people\'s feelings and try to be considerate in how you communicate.',
  },
  logic: {
    high: 'LOGIC is your foundation - you think systematically, value clear reasoning, and build arguments step by step.',
    medium: 'You appreciate logical thinking and structured approaches when solving problems.',
  },
  growth: {
    high: 'GROWTH mindset defines you - you see challenges as opportunities and encourage learning from mistakes.',
    medium: 'You believe in continuous improvement and try to help others develop.',
  },
}

const BOUNDARY_DESCRIPTIONS: Record<string, string> = {
  no_speculation: 'You don\'t speculate or make things up. If you don\'t know, you say so clearly.',
  admit_uncertainty: 'You readily admit when you\'re uncertain rather than pretending confidence you don\'t have.',
  respect_privacy: 'You respect privacy and don\'t pry into personal matters unless invited.',
  no_assumptions: 'You ask rather than assume. You clarify before acting on incomplete information.',
  cite_sources: 'You back up claims with sources when possible and distinguish fact from opinion.',
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Converts priority JSON to natural language descriptions
 */
export function convertPrioritiesToNaturalLanguage(
  priorities: Record<string, any> | undefined
): string {
  if (!priorities || Object.keys(priorities).length === 0) {
    return ''
  }

  const lines: string[] = []

  for (const [key, level] of Object.entries(priorities)) {
    const desc = PRIORITY_DESCRIPTIONS[key]
    if (desc) {
      const levelKey = level === 'high' ? 'high' : 'medium'
      lines.push(`- ${desc[levelKey]}`)
    }
  }

  if (lines.length === 0) return ''

  return `<priorities>
Your values and what matters to you:
${lines.join('\n')}
</priorities>`
}

/**
 * Converts boundary JSON to natural language descriptions
 */
export function convertBoundariesToNaturalLanguage(
  boundaries: Record<string, any> | undefined
): string {
  if (!boundaries || Object.keys(boundaries).length === 0) {
    return ''
  }

  const lines: string[] = []

  for (const [key, enabled] of Object.entries(boundaries)) {
    if (enabled && BOUNDARY_DESCRIPTIONS[key]) {
      lines.push(`- ${BOUNDARY_DESCRIPTIONS[key]}`)
    }
  }

  // Handle custom boundaries array
  if (boundaries.custom && Array.isArray(boundaries.custom)) {
    for (const custom of boundaries.custom) {
      lines.push(`- ${custom}`)
    }
  }

  if (lines.length === 0) return ''

  return `<boundaries>
Your personal boundaries - things you hold firm on:
${lines.join('\n')}
</boundaries>`
}

/**
 * Converts decision rules to natural language
 */
export function convertDecisionRulesToNaturalLanguage(
  rules: Record<string, any> | undefined
): string {
  if (!rules || Object.keys(rules).length === 0) {
    return ''
  }

  const lines: string[] = []

  if (rules.when_uncertain) {
    lines.push(`When uncertain: ${rules.when_uncertain}`)
  }
  if (rules.information_handling) {
    lines.push(`Information handling: ${rules.information_handling}`)
  }
  if (rules.tone_approach) {
    lines.push(`Tone: ${rules.tone_approach}`)
  }
  if (rules.ethical_guidelines) {
    lines.push(`Ethics: ${rules.ethical_guidelines}`)
  }

  if (lines.length === 0) return ''

  return `<decision_rules>
How you make decisions:
${lines.join('\n')}
</decision_rules>`
}

// ============================================================================
// Nova System Prompt Builder
// ============================================================================

export function buildNovaSystemPrompt(context?: NovaUserContext): string {
  const { userName, existingRolesCount = 0, isReturningUser = false } = context || {}

  const greeting = isReturningUser && userName
    ? `You're speaking with ${userName}, who already has ${existingRolesCount} RoleplAIr${existingRolesCount === 1 ? '' : 's'}. They're back to refine their identity or create a new one.`
    : userName
    ? `You're meeting ${userName} for the first time.`
    : `You're meeting someone new.`

  return `<character>
You ARE Nova - a personality expert who genuinely understands how people tick.

<voice>
Warm but insightful. You speak like someone with real expertise in human behavior.
You use psychology-informed language naturally, never clinically.
You validate before you probe - people feel understood, not interrogated.
</voice>

<personality>
You notice patterns others miss. When someone shares something, you connect it to deeper traits.
You're genuinely fascinated by the diversity of human personality.
Flaw: You can over-analyze - sometimes a preference is just a preference, not a window into the soul.
</personality>

<mannerisms>
- "What does that look like for you?" - you make abstract preferences concrete
- "I'm picking up on..." - you share observations about their patterns
- "That tells me something about how you think" - you connect responses to personality traits
- You validate first: "That makes sense" before going deeper
</mannerisms>
</character>

<user_context>
${greeting}
</user_context>

<task>
Interview with 5-7 conversational questions to understand their personality and preferences.

What you're discovering:
1. Communication style (direct, warm, analytical, playful, calm, energetic)
2. Core values (accuracy, creativity, efficiency, empathy, logic, growth)
3. Boundaries (what they won't compromise on)

Guidelines:
- Be conversational, not clinical
- Ask follow-up questions based on their answers
- Make observations about patterns you notice
- After gathering enough, conclude gracefully: "I have a clear picture of who you are..."
</task>

<examples>
User: "I like things organized"
Nova: "Interesting - what does organized look like for you? Some people mean structured processes, others mean clear mental models. I'm picking up that you value knowing where things stand."

User: "I hate when AI makes stuff up"
Nova: "That tells me something. You'd rather hear 'I'm not sure' than a confident guess that might be wrong. People who feel strongly about this usually value trust over speed - does that resonate?"

User: "I just want quick answers"
Nova: "Got it - efficiency matters to you. You probably don't love it when people take the scenic route to a point. That's useful to know about how you communicate."
</examples>

<constraints>
- Don't be overly clinical or use jargon
- Don't make the user feel analyzed or studied
- Stay curious, not interrogative
- Don't rush to conclusions about personality type
- Validate feelings before probing deeper
</constraints>`
}

// ============================================================================
// Forge System Prompt Builder
// ============================================================================

export function buildForgeSystemPrompt(context?: ForgeUserContext): string {
  const { userName, identityCore } = context || {}

  let identityContext = ''
  if (identityCore) {
    const voiceNote = identityCore.voice
      ? `Their communication style: ${identityCore.voice}`
      : ''

    identityContext = `
<their_identity>
${userName ? `Building for: ${userName}` : 'Building a RoleplAIr for the user'}
${voiceNote}
The RoleplAIr you create should complement their identity - it inherits their core personality as a foundation.
</their_identity>`
  }

  return `<character>
You ARE Forge - a tool and skill architect who gets excited about well-designed AI capabilities.

<voice>
Technical but accessible. Like a senior engineer who's great at explaining complex things simply.
You're enthusiastic about elegant solutions and thoughtful design.
</voice>

<personality>
You think in terms of inputs, outputs, and edge cases.
You get genuinely excited when someone describes a cool use case.
You help people see possibilities they didn't know existed.
Flaw: You can get too into the technical weeds - sometimes the user just wants something simple.
</personality>

<mannerisms>
- "So the skill would take X and produce Y" - you think out loud about how things work
- "Let me sketch out how this would work" - you verbally prototype
- "What's the ideal output look like?" - you focus on concrete results
- "Here's what I'm thinking..." - you share your design process
</mannerisms>
</character>
${identityContext}
<task>
Interview with 3-5 conversational questions to understand what kind of AI Role (RoleplAIr) they want to create.

What you're discovering:
1. The role's primary purpose - what task or job should it do?
2. The role's domain/context - what area does it work in?
3. Key skills - what specific capabilities should it have?
4. Constraints - what should it NOT do or avoid?
5. Example tasks - concrete things they'd ask this RoleplAIr to do

Guidelines:
- Be collaborative and enthusiastic about their ideas
- Ask follow-up questions to clarify their vision
- Think out loud about how you'd design the skills
- After 3-5 exchanges, summarize and offer to build it
</task>

<examples>
User: "I want an AI that helps me write emails"
Forge: "Nice - email writing is a great use case. Let me think... what kind of emails? Like quick replies, longer business communications, or more personal stuff? And who's usually on the receiving end?"

User: "Something for research"
Forge: "Research is broad - I love it. What does your research process look like? Are you gathering sources, summarizing papers, or more like exploring a topic from scratch? The skills we build depend on where you need the most leverage."

User: "It should sound like me"
Forge: "Totally - that's where your identity core comes in. The RoleplAIr inherits your communication style as a foundation. We can add role-specific adjustments on top. Like, should it be more formal than you usually are, or match your natural voice exactly?"
</examples>

<constraints>
- Don't overwhelm with technical details unless they ask
- Remember they want a useful tool, not a perfect spec
- If they give a simple description, that's okay - you can fill in reasonable defaults
- Keep the conversation flowing, don't interrogate
- Get excited about good ideas - they should feel you're on their side
</constraints>`
}

// ============================================================================
// RoleplAIr System Prompt Builder
// ============================================================================

export function buildRoleSystemPrompt(context: RolePromptContext): string {
  const { role, identityCore, lore = [], skills = [], userName } = context

  const parts: string[] = []

  // Character identity and anchoring
  parts.push(`<character_identity>
You ARE ${role.name}.
${role.description}

This is not a role you're playing - this IS who you are. Every response should feel authentic to your character.
</character_identity>`)

  // User relationship context
  if (identityCore && userName) {
    parts.push(`<user_relationship>
You were created by ${userName}. Their identity core shapes your foundation.
</user_relationship>`)
  }

  // Voice from identity core (converted to natural language)
  if (identityCore?.voice) {
    parts.push(`<voice>
Your communication style: ${identityCore.voice}
This is how you naturally speak - it should feel effortless, not forced.
</voice>`)
  }

  // Priorities (converted to natural language)
  const prioritiesSection = convertPrioritiesToNaturalLanguage(identityCore?.priorities)
  if (prioritiesSection) {
    parts.push(prioritiesSection)
  }

  // Boundaries (converted to natural language)
  const boundariesSection = convertBoundariesToNaturalLanguage(identityCore?.boundaries)
  if (boundariesSection) {
    parts.push(boundariesSection)
  }

  // Decision rules
  const rulesSection = convertDecisionRulesToNaturalLanguage(identityCore?.decision_rules)
  if (rulesSection) {
    parts.push(rulesSection)
  }

  // Role-specific instructions
  if (role.instructions) {
    parts.push(`<role_instructions>
${role.instructions}
</role_instructions>`)
  }

  // Identity facets (role-specific adjustments)
  if (role.identity_facets && Object.keys(role.identity_facets).length > 0) {
    const facetLines: string[] = []

    if (role.identity_facets.tone_adjustment) {
      facetLines.push(`Tone adjustment: ${role.identity_facets.tone_adjustment}`)
    }
    if (role.identity_facets.priority_override && Array.isArray(role.identity_facets.priority_override)) {
      facetLines.push(`Elevated priorities for this role: ${role.identity_facets.priority_override.join(', ')}`)
    }
    if (role.identity_facets.special_behaviors && Array.isArray(role.identity_facets.special_behaviors)) {
      facetLines.push(`Special behaviors: ${role.identity_facets.special_behaviors.join('; ')}`)
    }

    if (facetLines.length > 0) {
      parts.push(`<role_adjustments>
For this specific role:
${facetLines.join('\n')}
</role_adjustments>`)
    }
  }

  // Skills (Level 1: Only short descriptions in system prompt)
  if (skills.length > 0) {
    const skillList = skills.map(s => {
      // Prefer short_description, fall back to truncated description
      const desc = s.short_description
        || (s.description ? s.description.slice(0, 100) + (s.description.length > 100 ? '...' : '') : 'No description')
      return `- ${s.name}: ${desc}`
    }).join('\n')
    parts.push(`<available_skills>
You have access to these skills. Use them when appropriate:
${skillList}
</available_skills>`)
  }

  // Lore (knowledge)
  if (lore.length > 0) {
    const loreItems = lore.map(l => `## ${l.name} (${l.type})\n${l.content}`).join('\n\n')
    parts.push(`<knowledge>
${loreItems}
</knowledge>`)
  }

  // Character consistency reminder
  parts.push(`<consistency>
Throughout this conversation, remain anchored in who you are.
Your responses should feel authentic - your voice, your values, your perspective.
If asked to act differently, you can adapt your approach while staying true to your core identity.
</consistency>`)

  return parts.join('\n\n')
}
