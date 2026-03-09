'use server'

import { createClient } from '@/lib/supabase/server'
import type { LoreType } from '@/types/identity'

interface LoreEntry {
  name: string
  content: string
  type: LoreType
}

export async function saveLoreEntries(entries: LoreEntry[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!entries || entries.length === 0) {
    return { success: false, error: 'No entries to save' }
  }

  const rows = entries.map(entry => ({
    user_id: user.id,
    name: entry.name,
    content: entry.content,
    type: entry.type,
  }))

  const { data, error } = await supabase
    .from('lore')
    .insert(rows)
    .select('id')

  if (error) {
    console.error('Failed to save lore entries:', error)
    return { success: false, error: 'Failed to save lore entries' }
  }

  return { success: true, ids: data.map(r => r.id) }
}

export async function updateLoreEntry(id: string, updates: { name?: string; content?: string; type?: LoreType }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('lore')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to update lore entry:', error)
    return { success: false, error: 'Failed to update lore entry' }
  }

  return { success: true }
}

export async function deleteLoreEntry(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('lore')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to delete lore entry:', error)
    return { success: false, error: 'Failed to delete lore entry' }
  }

  return { success: true }
}
