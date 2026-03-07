import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export const DEFAULT_TEMPERATURE = 0.7

/**
 * Create a model instance using system API keys.
 * Prefers Anthropic, falls back to OpenAI.
 */
export function getSystemModel(opts?: {
  anthropicModel?: string
  openaiModel?: string
}): { model: LanguageModel } | { error: Response } {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (anthropicKey) {
    const anthropic = createAnthropic({ apiKey: anthropicKey })
    return { model: anthropic(opts?.anthropicModel || 'claude-haiku-4-5') }
  }

  if (openaiKey) {
    const openai = createOpenAI({ apiKey: openaiKey })
    return { model: openai(opts?.openaiModel || 'gpt-5-nano') }
  }

  return {
    error: errorResponse('No AI provider configured', 500),
  }
}

/**
 * Create a consistent JSON error response.
 */
export function errorResponse(
  message: string,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  )
}
