'use server'

import { requireAuth, verifyRoleOwnership } from '@/lib/supabase/auth-helpers'
import { generateConversationSummary } from '@/lib/ai/generate-summary'
import type { Conversation, ConversationWithMessages, MessageRole } from '@/types/conversation'

/**
 * Create a new conversation for a role
 */
export async function createConversation(roleId: string, title?: string): Promise<{
  success: boolean
  conversationId?: string
  error?: string
}> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  if (!await verifyRoleOwnership(supabase, roleId, user.id)) {
    return { success: false, error: 'Role not found' }
  }

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      role_id: roleId,
      title: title || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Conversation creation error:', error)
    return { success: false, error: 'Failed to create conversation' }
  }

  return { success: true, conversationId: conversation.id }
}

/**
 * Get conversations for a role (paginated, most recent first)
 */
export async function getRoleConversations(
  roleId: string,
  limit = 20,
  offset = 0
): Promise<{
  success: boolean
  conversations: Conversation[]
  error?: string
}> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, conversations: [], error: auth.error }
  const { supabase, user } = auth

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('role_id', roleId)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching conversations:', error)
    return { success: false, conversations: [], error: 'Failed to fetch conversations' }
  }

  return { success: true, conversations: conversations || [] }
}

/**
 * Get a conversation with its messages
 */
export async function getConversationWithMessages(
  conversationId: string
): Promise<{
  success: boolean
  conversation?: ConversationWithMessages
  error?: string
}> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  // Fetch conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (convError || !conversation) {
    return { success: false, error: 'Conversation not found' }
  }

  // Fetch messages
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgError) {
    console.error('Error fetching messages:', msgError)
    return { success: false, error: 'Failed to fetch messages' }
  }

  return {
    success: true,
    conversation: {
      ...conversation,
      messages: messages || [],
    },
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  metadata?: Record<string, unknown>
): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  // Verify conversation ownership
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (convError || !conversation) {
    return { success: false, error: 'Conversation not found' }
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata: metadata || {},
    })
    .select('id')
    .single()

  if (error) {
    console.error('Message creation error:', error)
    return { success: false, error: 'Failed to save message' }
  }

  // Update conversation's updated_at timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  return { success: true, messageId: message.id }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Title update error:', error)
    return { success: false, error: 'Failed to update title' }
  }

  return { success: true }
}

/**
 * Delete a conversation (cascades to messages)
 */
export async function deleteConversation(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Conversation deletion error:', error)
    return { success: false, error: 'Failed to delete conversation' }
  }

  return { success: true }
}

/**
 * Generate and store a summary for a conversation.
 * Fetches messages, generates a summary via AI, and updates the conversation record.
 */
export async function summarizeConversation(
  conversationId: string
): Promise<{ success: boolean; summary?: string; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  // Fetch messages for the conversation
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgError || !messages) {
    return { success: false, error: 'Failed to fetch messages' }
  }

  // Don't summarize short conversations
  if (messages.length < 4) {
    return { success: false, error: 'Not enough messages to summarize' }
  }

  const summary = await generateConversationSummary(messages)

  if (!summary) {
    return { success: false, error: 'Failed to generate summary' }
  }

  // Store the summary
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ summary })
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Summary update error:', updateError)
    return { success: false, error: 'Failed to save summary' }
  }

  return { success: true, summary }
}
