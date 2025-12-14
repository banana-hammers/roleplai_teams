import { VOICE_DESCRIPTIONS, type VoiceType, type PriorityValue, type BoundaryType } from '@/lib/constants/interview-prompts'

export interface ExtractedPersonality {
  voice: VoiceType
  priorities: PriorityValue[]
  boundaries: BoundaryType[]
  customBoundaries?: string[]
  confidence: number
}

export interface IdentityCore {
  voice: string // Full descriptive text
  priorities: Record<string, string> // { accuracy: "high", creativity: "medium", ... }
  boundaries: Record<string, boolean | string[]> // { no_speculation: true, custom: ["..."] }
  decision_rules: {
    when_uncertain: string
    information_handling: string
    tone_approach: string
    ethical_guidelines: string[]
  }
}

export interface BehaviorExample {
  scenario: string
  response: string
  traits: string[] // Which traits are being demonstrated
}

/**
 * Generate full identity core from extracted personality
 */
export function generateIdentityCore(personality: ExtractedPersonality): IdentityCore {
  const voice = VOICE_DESCRIPTIONS[personality.voice]

  // Map priorities to importance levels
  const priorities: Record<string, string> = {}
  const allPriorities: PriorityValue[] = ['accuracy', 'creativity', 'efficiency', 'empathy', 'logic', 'growth']

  allPriorities.forEach(priority => {
    if (personality.priorities.includes(priority)) {
      priorities[priority] = 'high'
    } else {
      priorities[priority] = 'medium'
    }
  })

  // Map boundaries to boolean flags + custom
  const boundaries: Record<string, boolean | string[]> = {
    no_speculation: personality.boundaries.includes('no_speculation'),
    admit_uncertainty: personality.boundaries.includes('admit_uncertainty'),
    respect_privacy: personality.boundaries.includes('respect_privacy'),
    no_assumptions: personality.boundaries.includes('no_assumptions'),
    cite_sources: personality.boundaries.includes('cite_sources'),
  }

  if (personality.customBoundaries && personality.customBoundaries.length > 0) {
    boundaries.custom = personality.customBoundaries
  }

  // Generate decision rules based on priorities and boundaries
  const decision_rules = {
    when_uncertain: personality.boundaries.includes('admit_uncertainty')
      ? 'Always admit uncertainty and offer to research'
      : 'Provide best available information with confidence level',

    information_handling: personality.priorities.includes('accuracy')
      ? 'Prioritize accuracy over speed; cite sources when possible'
      : personality.priorities.includes('efficiency')
      ? 'Balance accuracy with speed; provide quick overviews with option for deeper research'
      : 'Provide balanced, well-researched information',

    tone_approach: voice.includes('direct')
      ? 'Be clear and concise while maintaining respect'
      : voice.includes('warm')
      ? 'Be friendly and approachable like talking to a trusted friend'
      : voice.includes('analytical')
      ? 'Be detailed and methodical with evidence-based responses'
      : 'Adapt tone to context while staying authentic',

    ethical_guidelines: [
      ...personality.boundaries.includes('no_speculation') ? ['Never guess or fabricate information'] : [],
      ...personality.boundaries.includes('respect_privacy') ? ['Respect user privacy and boundaries'] : [],
      ...personality.boundaries.includes('no_assumptions') ? ['Ask for clarification instead of assuming'] : [],
      ...personality.customBoundaries || [],
    ],
  }

  return {
    voice,
    priorities,
    boundaries,
    decision_rules,
  }
}

/**
 * Generate concrete behavior examples based on identity
 */
export function generateBehaviorExamples(
  personality: ExtractedPersonality,
  identity: IdentityCore
): BehaviorExample[] {
  const examples: BehaviorExample[] = []

  // Example 1: Handling uncertainty
  if (personality.boundaries.includes('admit_uncertainty')) {
    examples.push({
      scenario: "You ask me a question I don't know the answer to",
      response: personality.priorities.includes('accuracy')
        ? "I don't know the answer to that, but I can help you research it. Would you like me to find reliable sources?"
        : "I'm not sure about that. Let me look into it for you.",
      traits: ['admit_uncertainty', 'accuracy'],
    })
  }

  // Example 2: Decision making
  if (personality.priorities.includes('logic') || personality.priorities.includes('accuracy')) {
    examples.push({
      scenario: "You're deciding between two options",
      response: personality.voice.includes('direct')
        ? "Here are the key facts for each option: [X vs Y]. Based on these, option A seems stronger because..."
        : "Let me help you think through this. Looking at the facts: [X vs Y]. What matters most to you in this decision?",
      traits: ['logic', 'accuracy', personality.voice],
    })
  }

  // Example 3: Avoiding assumptions
  if (personality.boundaries.includes('no_assumptions')) {
    examples.push({
      scenario: "I notice something unclear in your message",
      response: "I noticed you mentioned X. Could you clarify what you mean by that? I want to make sure I understand correctly.",
      traits: ['no_assumptions', 'respect_privacy'],
    })
  }

  // Example 4: Creative thinking
  if (personality.priorities.includes('creativity')) {
    examples.push({
      scenario: "You ask for ideas or alternatives",
      response: personality.boundaries.includes('no_speculation')
        ? "Here are some creative approaches: [ideas]. To be clear, these are possibilities - not proven solutions. Would you like me to research which might work best?"
        : "Think of it like [creative metaphor]. Here are some out-of-the-box ideas: [alternatives].",
      traits: ['creativity', personality.boundaries.includes('no_speculation') ? 'no_speculation' : ''],
    })
  }

  // Example 5: Empathy vs directness
  if (personality.priorities.includes('empathy') && personality.voice.includes('direct')) {
    examples.push({
      scenario: "I need to deliver difficult feedback",
      response: "I see a different perspective here. Let me explain why: [reasoning]. Does that make sense?",
      traits: ['empathy', 'direct', 'respectful'],
    })
  } else if (personality.priorities.includes('empathy')) {
    examples.push({
      scenario: "You're facing a challenge",
      response: "That sounds frustrating. Let me help you work through this. Here's what I'm thinking...",
      traits: ['empathy', 'warm'],
    })
  }

  return examples.slice(0, 5) // Return top 5 examples
}
