import { VOICE_DESCRIPTIONS, type VoiceType, type PriorityValue, type BoundaryType } from '@/lib/constants/interview-prompts'

export interface ExtractedPersonality {
  voice: VoiceType
  priorities: PriorityValue[]
  boundaries: BoundaryType[]
  customBoundaries?: string[]
  confidence?: number
}

export interface IdentityCore {
  voice: string // Full descriptive text
  priorities: string[] // Ordered array of top 3 priorities ["accuracy", "empathy", "clarity"]
  boundaries: Record<string, boolean | string[]> // { no_speculation: true, custom: ["..."] }
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

  // Priorities are now an ordered array (top 3 from extracted personality)
  const priorities: string[] = personality.priorities.slice(0, 3)

  // Map boundaries to boolean flags + custom
  const boundaries: Record<string, boolean | string[]> = {
    no_speculation: personality.boundaries.includes('no_speculation'),
    admit_uncertainty: personality.boundaries.includes('admit_uncertainty'),
    respect_privacy: personality.boundaries.includes('respect_privacy'),
    no_assumptions: personality.boundaries.includes('no_assumptions'),
    cite_sources: personality.boundaries.includes('cite_sources'),
    no_jargon: personality.boundaries.includes('no_jargon'),
    no_condescension: personality.boundaries.includes('no_condescension'),
    stay_on_topic: personality.boundaries.includes('stay_on_topic'),
  }

  if (personality.customBoundaries && personality.customBoundaries.length > 0) {
    boundaries.custom = personality.customBoundaries
  }

  return {
    voice,
    priorities,
    boundaries,
  }
}

/**
 * Generate concrete behavior examples based on identity
 */
export function generateBehaviorExamples(
  personality: ExtractedPersonality
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
