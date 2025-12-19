'use client'

import { useState, useCallback, useRef } from 'react'

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

export interface UseRoleChatOptions {
  roleId: string
}

export interface UseRoleChatReturn {
  messages: Message[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

/**
 * Custom hook for role-based chat with web tools support.
 * Handles SSE stream from the chat API endpoint with built-in tools (web_search, web_fetch).
 */
export function useRoleChat({ roleId }: UseRoleChatOptions): UseRoleChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setError(null)
    setIsLoading(true)

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim()
    }
    setMessages(prev => [...prev, userMessage])

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

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch(`/api/roles/${roleId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
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
                setMessages(prev => prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.content }
                    : m
                ))
              } else if (event.type === 'tool_call_start') {
                currentToolCalls.push({ id: event.id, name: event.tool })
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
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId
                      ? { ...m, toolCalls: [...currentToolCalls] }
                      : m
                  ))
                }
              } else if (event.type === 'error') {
                setError(event.message)
              }
              // 'done' type is handled implicitly when stream ends
            } catch {
              // Ignore JSON parse errors for incomplete data
            }
          }
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
  }, [roleId, messages, isLoading])

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setMessages([])
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  }
}
