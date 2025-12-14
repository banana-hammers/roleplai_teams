import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * Check if an alias is available
 * GET /api/check-alias?alias=username
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const alias = searchParams.get('alias')

  if (!alias) {
    return NextResponse.json(
      { error: 'Alias parameter is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Check if alias already exists
  const { data, error } = await supabase
    .from('profiles')
    .select('alias')
    .eq('alias', alias)
    .maybeSingle()

  if (error) {
    console.error('Error checking alias:', error)
    return NextResponse.json(
      { error: 'Failed to check alias availability' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    available: !data,
    alias,
  })
}
