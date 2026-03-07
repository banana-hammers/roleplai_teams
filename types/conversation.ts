export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  metadata: Record<string, any>
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  role_id: string
  title: string | null
  summary: string | null
  created_at: string
  updated_at: string
}

// Conversation with nested messages for fetching
export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}
