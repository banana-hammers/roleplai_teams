'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Plus, Trash2, Loader2, Search } from 'lucide-react'
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

function getDateGroup(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  if (date >= today) return 'Today'
  if (date >= yesterday) return 'Yesterday'
  if (date >= weekAgo) return 'This Week'
  return 'Older'
}

type GroupedConversations = Record<string, Conversation[]>

export function ConversationList({
  roleId,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  // Filter and group conversations
  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter(conv =>
      !searchQuery ||
      (conv.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const groups: GroupedConversations = {}
    const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older']

    for (const conv of filtered) {
      const group = getDateGroup(conv.updated_at)
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(conv)
    }

    // Return in order
    const orderedGroups: GroupedConversations = {}
    for (const group of groupOrder) {
      if (groups[group]?.length > 0) {
        orderedGroups[group] = groups[group]
      }
    }
    return orderedGroups
  }, [conversations, searchQuery])

  const hasConversations = Object.keys(groupedConversations).length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header with search and new chat */}
      <div className="p-3 border-b space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 h-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* New chat button */}
        <Button
          onClick={onNewConversation}
          className={cn(
            'w-full gap-2',
            'bg-primary hover:bg-primary/90',
          )}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !hasConversations ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
          </div>
        ) : (
          <div className="py-2">
            {Object.entries(groupedConversations).map(([group, convs]) => (
              <div key={group}>
                {/* Group header */}
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground sticky top-0 bg-background">
                  {group}
                </div>

                {/* Conversations in group */}
                <div className="px-2 space-y-0.5">
                  {convs.map((conv) => (
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectConversation(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectConversation(conv.id)
                        }
                      }}
                      className={cn(
                        'w-full px-3 py-2.5 text-left rounded-lg transition-colors group cursor-pointer',
                        'hover:bg-muted/50',
                        'min-h-[52px]', // Touch target
                        activeConversationId === conv.id && 'bg-muted'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conv.title || 'Untitled conversation'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatRelativeTime(conv.updated_at)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, conv.id)}
                          className={cn(
                            'p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity',
                            'hover:bg-destructive/10 hover:text-destructive',
                            'min-h-7 min-w-7 flex items-center justify-center'
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
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
