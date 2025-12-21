'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react'
import { getRoleConversations, deleteConversation } from '@/app/actions/conversations'
import type { Conversation } from '@/types/conversation'

interface ConversationListProps {
  roleId: string
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function ConversationList({
  roleId,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    setIsLoading(true)
    const result = await getRoleConversations(roleId)
    if (result.success) {
      setConversations(result.conversations)
    }
    setIsLoading(false)
  }, [roleId])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Reload conversations when active conversation changes (new conversation created)
  useEffect(() => {
    if (activeConversationId && !conversations.find(c => c.id === activeConversationId)) {
      loadConversations()
    }
  }, [activeConversationId, conversations, loadConversations])

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()

    if (!confirm('Delete this conversation? This cannot be undone.')) {
      return
    }

    setDeletingId(conversationId)
    const result = await deleteConversation(conversationId)

    if (result.success) {
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      // If we deleted the active conversation, start a new one
      if (conversationId === activeConversationId) {
        onNewConversation()
      }
    }
    setDeletingId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button onClick={onNewConversation} className="w-full" size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={cn(
                  'w-full px-3 py-2 text-left rounded-md transition-colors group',
                  'hover:bg-muted/50',
                  activeConversationId === conv.id && 'bg-muted'
                )}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.title || 'Untitled conversation'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(conv.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    className={cn(
                      'p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                      'hover:bg-destructive/10 hover:text-destructive'
                    )}
                    disabled={deletingId === conv.id}
                  >
                    {deletingId === conv.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
