import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { encryptApiKey, isEncryptionConfigured } from '@/lib/crypto/api-key-encryption'

export const runtime = 'edge'

/**
 * POST /api/user/api-keys
 * Add a new API key (encrypted server-side)
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check encryption is configured
  if (!isEncryptionConfigured()) {
    console.error('ENCRYPTION_MASTER_KEY is not configured')
    return NextResponse.json(
      { error: 'Server encryption not configured' },
      { status: 500 }
    )
  }

  const { provider, key, label } = await req.json()

  if (!provider || !key) {
    return NextResponse.json(
      { error: 'Provider and key are required' },
      { status: 400 }
    )
  }

  // Validate provider
  const validProviders = ['anthropic', 'openai']
  if (!validProviders.includes(provider)) {
    return NextResponse.json(
      { error: 'Invalid provider' },
      { status: 400 }
    )
  }

  // Basic key format validation
  if (provider === 'anthropic' && !key.startsWith('sk-ant-')) {
    return NextResponse.json(
      { error: 'Invalid Anthropic API key format' },
      { status: 400 }
    )
  }
  if (provider === 'openai' && !key.startsWith('sk-')) {
    return NextResponse.json(
      { error: 'Invalid OpenAI API key format' },
      { status: 400 }
    )
  }

  try {
    // Encrypt the API key server-side
    const encryptedKey = await encryptApiKey(key, user.id)

    // Store in database
    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        provider,
        encrypted_key: encryptedKey,
        label: label || null,
      })
      .select('id, provider, label, created_at')
      .single()

    if (error) {
      console.error('Failed to store API key:', error)
      return NextResponse.json(
        { error: 'Failed to store API key' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Encryption error:', error)
    return NextResponse.json(
      { error: 'Failed to encrypt API key' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/api-keys
 * List user's API keys (without revealing the actual keys)
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('id, provider, label, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }

  return NextResponse.json(data)
}

/**
 * DELETE /api/user/api-keys
 * Delete an API key
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'Key ID is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
