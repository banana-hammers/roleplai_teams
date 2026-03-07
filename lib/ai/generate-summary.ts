import { generateText } from 'ai'
import { getSystemModel } from '@/lib/ai/create-system-model'

/**
 * Generate a concise summary of a conversation using a lightweight model.
 * Returns an empty string on failure.
 */
export async function generateConversationSummary(
  messages: { role: string; content: string }[]
): Promise<string> {
  // Don't summarize short conversations
  if (messages.length < 4) return ''

  const result = getSystemModel()
  if ('error' in result) return ''

  try {
    // Build a condensed transcript (limit to avoid token bloat)
    const transcript = messages
      .slice(-20) // Last 20 messages max
      .map(m => `${m.role}: ${m.content.slice(0, 500)}`)
      .join('\n')

    const { text } = await generateText({
      model: result.model,
      system: 'You are a conversation summarizer. Write a concise 2-3 sentence summary capturing the key topics discussed, decisions made, and outcomes reached. Do not use phrases like "In this conversation". Be direct and informative.',
      prompt: transcript,
      temperature: 0.3,
    })

    return text.trim()
  } catch (error) {
    console.error('[Summary] Failed to generate conversation summary:', error)
    return ''
  }
}
