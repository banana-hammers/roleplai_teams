'use client'

import { useState, useCallback, useRef } from 'react'
import {
  createConversation,
  addMessage as addMessageToDb,
  getConversationWithMessages,
  updateConversationTitle,
} from '@/app/actions/conversations'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: Array<{
    id?: string
    name: string
    result?: string
  }>
}

export interface McpServerError {
  server: string
  message: string
}

export interface UseRoleChatOptions {
  roleId: string
  conversationId?: string
  onConversationCreated?: (id: string) => void
}

export interface UseRoleChatReturn {
  messages: Message[]
  isLoading: boolean
  error: string | null
  mcpErrors: McpServerError[]
  conversationId: string | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  loadConversation: (id: string) => Promise<void>
  clearMcpErrors: () => void
}

/**
 * Custom hook for role-based chat with web tools support.
 * Handles SSE stream from the chat API endpoint with built-in tools (web_search, web_fetch).
 * Supports conversation persistence - messages are saved to the database.
 */
export function useRoleChat({ roleId, conversationId: initialConversationId, onConversationCreated }: UseRoleChatOptions): UseRoleChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mcpErrors, setMcpErrors] = useState<McpServerError[]>([])
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isFirstMessageRef = useRef(!initialConversationId)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setError(null)
    setIsLoading(true)

    let activeConversationId = conversationId

    // Create a new conversation if this is the first message
    if (!activeConversationId) {
      const result = await createConversation(roleId)
      if (!result.success || !result.conversationId) {
        setError(result.error || 'Failed to create conversation')
        setIsLoading(false)
        return
      }
      activeConversationId = result.conversationId
      setConversationId(activeConversationId)
      isFirstMessageRef.current = true
      onConversationCreated?.(activeConversationId)
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim()
    }
    setMessages(prev => [...prev, userMessage])

    // Persist user message to database
    await addMessageToDb(activeConversationId, 'user', userMessage.content)

    // Create assistant message placeholder
    const assistantId = `assistant-${Date.now()}`
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolCalls: []
    }
    setMessages(prev => [...prev, assistantMessage])

    // Prepare messages for API (all previous messages + new user message)
    const apiMessages = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content
    }))

    // Track the full assistant response for persistence
    let fullAssistantContent = ''
    let assistantToolCalls: Array<{ id?: string; name: string; result?: string }> = []

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch(`/api/roles/${roleId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, conversationId: activeConversationId }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentToolCalls: Array<{ id?: string; name: string; result?: string }> = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (!data) continue

            try {
              const event = JSON.parse(data)

              if (event.type === 'text' || event.type === 'text_delta') {
                fullAssistantContent += event.content
                setMessages(prev => prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.content }
                    : m
                ))
              } else if (event.type === 'tool_call_start') {
                currentToolCalls.push({ id: event.id, name: event.tool })
                assistantToolCalls = [...currentToolCalls]
                setMessages(prev => prev.map(m =>
                  m.id === assistantId
                    ? { ...m, toolCalls: [...currentToolCalls] }
                    : m
                ))
              } else if (event.type === 'tool_result') {
                // Match by ID (agent endpoint) or by name (chat endpoint fallback)
                const toolIndex = currentToolCalls.findIndex(t =>
                  (event.id && t.id === event.id) ||
                  (event.tool && t.name === event.tool && !t.result)
                )
                if (toolIndex !== -1) {
                  currentToolCalls[toolIndex].result = event.result
                  assistantToolCalls = [...currentToolCalls]
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId
                      ? { ...m, toolCalls: [...currentToolCalls] }
                      : m
                  ))
                }
              } else if (event.type === 'error') {
                setError(event.message)
              } else if (event.type === 'mcp_error') {
                // MCP server connection errors
                setMcpErrors(event.errors || [])
              }
              // 'done' type is handled implicitly when stream ends
            } catch {
              // Ignore JSON parse errors for incomplete data
            }
          }
        }
      }

      // Persist assistant message to database after stream completes
      if (fullAssistantContent && activeConversationId) {
        const metadata = assistantToolCalls.length > 0 ? { toolCalls: assistantToolCalls } : {}
        await addMessageToDb(activeConversationId, 'assistant', fullAssistantContent, metadata)

        // Generate title from first user message if this is a new conversation
        if (isFirstMessageRef.current) {
          const title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '')
          await updateConversationTitle(activeConversationId, title)
          isFirstMessageRef.current = false
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, ignore
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred')
        // Remove the empty assistant message on error
        setMessages(prev => prev.filter(m => m.id !== assistantId))
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [roleId, messages, isLoading, conversationId, onConversationCreated])

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setMessages([])
    setError(null)
    setMcpErrors([])
    setIsLoading(false)
    setConversationId(null)
    isFirstMessageRef.current = true
  }, [])

  const clearMcpErrors = useCallback(() => {
    setMcpErrors([])
  }, [])

  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    const result = await getConversationWithMessages(id)

    if (!result.success || !result.conversation) {
      setError(result.error || 'Failed to load conversation')
      setIsLoading(false)
      return
    }

    // Convert database messages to hook message format
    const loadedMessages: Message[] = result.conversation.messages
      .filter(m => m.role !== 'system') // Don't show system messages
      .map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        toolCalls: m.metadata?.toolCalls || undefined,
      }))

    setMessages(loadedMessages)
    setConversationId(id)
    isFirstMessageRef.current = false
    setIsLoading(false)
  }, [])

  return {
    messages,
    isLoading,
    error,
    mcpErrors,
    conversationId,
    sendMessage,
    clearMessages,
    loadConversation,
    clearMcpErrors,
  }
}
