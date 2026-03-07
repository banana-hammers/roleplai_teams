import { decryptApiKey, isEncryptionConfigured } from '@/lib/crypto/api-key-encryption'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve an API key for a provider.
 * Checks for BYO user key first (decrypting it), then falls back to system env key.
 */
export async function resolveApiKey(
  supabase: SupabaseClient,
  userId: string,
  provider: 'anthropic' | 'openai'
): Promise<string | null> {
  // Check for user's BYO API key
  const { data: apiKeyRow } = await supabase
    .from('user_api_keys')
    .select('encrypted_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle()

  // Decrypt user's API key if available
  if (apiKeyRow?.encrypted_key && isEncryptionConfigured()) {
    try {
      return await decryptApiKey(apiKeyRow.encrypted_key, userId)
    } catch (error) {
      console.error('Failed to decrypt API key:', error)
      // Fall through to system key
    }
  }

  // Fall back to system API key
  if (provider === 'openai') return process.env.OPENAI_API_KEY || null
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY || null

  return null
}
