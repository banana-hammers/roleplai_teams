'use client'

import { useState, useCallback, useRef } from 'react'
import {
  createConversation,
  addMessage as addMessageToDb,
  getConversationWithMessages,
  updateConversationTitle,
} from '@/app/actions/conversations'

export interface MessageUsage {
  inputTokens: number
  outputTokens: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
  cost: number
  formattedCost: string
}

/**
 * Tracks progress of a skill execution with nested tool calls
 */
export interface SkillProgress {
  skillId: string
  skillName: string
  status: 'running' | 'completed' | 'error'
  currentIteration: number
  maxIterations: number
  streamingText: string
  toolCalls: Array<{
    toolId: string
    toolName: string
    iteration: number
    input?: Record<string, unknown>
    result?: string
    status: 'running' | 'completed' | 'error'
  }>
  finalResult?: string
  error?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: Array<{
    id?: string
    name: string
    input?: Record<string, unknown>
    result?: string
    /** Explicit status for UI display */
    status?: 'running' | 'completed' | 'error'
    /** If this tool call is a skill, tracks its execution progress */
    skillProgress?: SkillProgress
  }>
  usage?: MessageUsage
}

export interface McpServerError {
  server: string
  message: string
}

export interface RateLimitInfo {
  retryAfterSeconds: number
  message: string
  timestamp: number
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
  rateLimitInfo: RateLimitInfo | null
  searchQuery: string | null
  conversationId: string | null
  /** Active skill executions with their progress */
  activeSkills: Map<string, SkillProgress>
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  loadConversation: (id: string) => Promise<void>
  clearMcpErrors: () => void
  clearRateLimitInfo: () => void
}

/**
 * Helper to update skill progress in the current tool calls array
 */
function updateToolCallSkillProgress(
  toolCalls: Array<{ id?: string; name: string; input?: Record<string, unknown>; result?: string; skillProgress?: SkillProgress }>,
  skillId: string,
  updatedProgress: SkillProgress
) {
  const toolIndex = toolCalls.findIndex(t => t.skillProgress?.skillId === skillId)
  if (toolIndex !== -1) {
    toolCalls[toolIndex].skillProgress = updatedProgress
  }
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
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [activeSkills, setActiveSkills] = useState<Map<string, SkillProgress>>(new Map())
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
    let assistantToolCalls: Array<{ id?: string; name: string; input?: Record<string, unknown>; result?: string }> = []
    let assistantUsage: MessageUsage | undefined

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
      let currentToolCalls: Array<{ id?: string; name: string; input?: Record<string, unknown>; result?: string; status?: 'running' | 'completed' | 'error'; skillProgress?: SkillProgress }> = []

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
                console.log('[Chat] tool_call_start:', { id: event.id, tool: event.tool, isServerTool: event.isServerTool })
                currentToolCalls.push({ id: event.id, name: event.tool, status: 'running' })
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
                  // Determine status based on result content
                  const isError = event.result?.toLowerCase().startsWith('error') ||
                    event.result?.toLowerCase().startsWith('failed')
                  currentToolCalls[toolIndex] = {
                    ...currentToolCalls[toolIndex],
                    input: event.input,
                    result: event.result,
                    status: isError ? 'error' : 'completed'
                  }
                  assistantToolCalls = [...currentToolCalls]
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId
                      ? { ...m, toolCalls: [...currentToolCalls] }
                      : m
                  ))
                }
              } else if (event.type === 'error') {
                // Check for rate limit error type
                if (event.errorType === 'rate_limit') {
                  setRateLimitInfo({
                    retryAfterSeconds: event.retryAfterSeconds || 60,
                    message: event.message,
                    timestamp: Date.now()
                  })
                }
                setError(event.message)
              } else if (event.type === 'retry') {
                // Server is retrying after rate limit, log for debugging
                console.log(`[Chat] Server retry: attempt ${event.attempt}, waiting ${event.delayMs}ms`)
              } else if (event.type === 'warning') {
                // Tool-level warning (e.g., skill hit rate limit but returned error text)
                console.warn(`[Chat] Warning: ${event.message}`)
              } else if (event.type === 'search_query') {
                // Web search query started - show in UI
                setSearchQuery(event.query)
              } else if (event.type === 'mcp_error') {
                // MCP server connection errors
                setMcpErrors(event.errors || [])
              } else if (event.type === 'usage') {
                // Token usage and cost data
                console.log('[Chat] Received usage event:', event)
                assistantUsage = {
                  inputTokens: event.inputTokens,
                  outputTokens: event.outputTokens,
                  cacheCreationTokens: event.cacheCreationTokens,
                  cacheReadTokens: event.cacheReadTokens,
                  cost: event.cost,
                  formattedCost: event.formattedCost,
                }
                // Update the message with usage data
                setMessages(prev => prev.map(m =>
                  m.id === assistantId
                    ? { ...m, usage: assistantUsage }
                    : m
                ))
              } else if (event.type === 'skill_start') {
                // Skill execution starting - create progress tracker
                console.log('[Chat] skill_start received:', {
                  skillId: event.skillId,
                  skillName: event.skillName,
                  toolName: event.toolName,
                  toolId: event.toolId,
                  currentToolCalls: currentToolCalls.map(t => ({ id: t.id, name: t.name, hasProgress: !!t.skillProgress }))
                })
                const skillProgress: SkillProgress = {
                  skillId: event.skillId,
                  skillName: event.skillName,
                  status: 'running',
                  currentIteration: 1,
                  maxIterations: event.maxIterations || 5,
                  streamingText: '',
                  toolCalls: []
                }
                setActiveSkills(prev => {
                  const next = new Map(prev)
                  next.set(event.skillId, skillProgress)
                  return next
                })
                // Link skill progress to the current tool call
                // Try to match by toolId first (most reliable), then by toolName
                const toolNameToMatch = event.toolName || event.skillName
                let toolIndex = -1
                if (event.toolId) {
                  toolIndex = currentToolCalls.findIndex(t => t.id === event.toolId)
                }
                if (toolIndex === -1) {
                  // Fallback to name matching - find tool without skillProgress
                  toolIndex = currentToolCalls.findIndex(t => t.name === toolNameToMatch && !t.skillProgress)
                }
                console.log('[Chat] skill_start matching:', {
                  toolNameToMatch,
                  toolId: event.toolId,
                  toolIndex,
                  found: toolIndex !== -1,
                  matchMethod: event.toolId && toolIndex !== -1 ? 'id' : 'name'
                })
                if (toolIndex !== -1) {
                  currentToolCalls[toolIndex].skillProgress = skillProgress
                  assistantToolCalls = [...currentToolCalls]
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId
                      ? { ...m, toolCalls: [...currentToolCalls] }
                      : m
                  ))
                } else {
                  console.warn('[Chat] skill_start: No matching tool found!', { toolNameToMatch, toolId: event.toolId })
                }
              } else if (event.type === 'skill_iteration') {
                // Skill iteration update
                setActiveSkills(prev => {
                  const skill = prev.get(event.skillId)
                  if (!skill) return prev
                  const next = new Map(prev)
                  const updated = { ...skill, currentIteration: event.iteration }
                  next.set(event.skillId, updated)
                  // Also update in tool calls
                  updateToolCallSkillProgress(currentToolCalls, event.skillId, updated)
                  return next
                })
              } else if (event.type === 'skill_text_delta') {
                // Streaming text from skill
                setActiveSkills(prev => {
                  const skill = prev.get(event.skillId)
                  if (!skill) return prev
                  const next = new Map(prev)
                  const updated = { ...skill, streamingText: skill.streamingText + event.content }
                  next.set(event.skillId, updated)
                  // Also update in tool calls
                  updateToolCallSkillProgress(currentToolCalls, event.skillId, updated)
                  return next
                })
              } else if (event.type === 'skill_tool_call_start') {
                // Nested tool call starting within skill
                setActiveSkills(prev => {
                  const skill = prev.get(event.skillId)
                  if (!skill) return prev
                  const next = new Map(prev)
                  const updated = {
                    ...skill,
                    toolCalls: [...skill.toolCalls, {
                      toolId: event.toolId,
                      toolName: event.toolName,
                      iteration: event.iteration,
                      status: 'running' as const
                    }]
                  }
                  next.set(event.skillId, updated)
                  // Also update in tool calls
                  updateToolCallSkillProgress(currentToolCalls, event.skillId, updated)
                  return next
                })
              } else if (event.type === 'skill_tool_result') {
                // Nested tool call completed
                setActiveSkills(prev => {
                  const skill = prev.get(event.skillId)
                  if (!skill) return prev
                  const next = new Map(prev)
                  const toolIndex = skill.toolCalls.findIndex(t => t.toolId === event.toolId)
                  if (toolIndex !== -1) {
                    const updatedToolCalls = [...skill.toolCalls]
                    updatedToolCalls[toolIndex] = {
                      ...updatedToolCalls[toolIndex],
                      input: event.input,
                      result: event.result,
                      status: event.isError ? 'error' : 'completed'
                    }
                    const updated = { ...skill, toolCalls: updatedToolCalls }
                    next.set(event.skillId, updated)
                    // Also update in tool calls
                    updateToolCallSkillProgress(currentToolCalls, event.skillId, updated)
                  }
                  return next
                })
              } else if (event.type === 'skill_complete') {
                // Skill execution completed
                setActiveSkills(prev => {
                  const skill = prev.get(event.skillId)
                  if (!skill) return prev
                  const next = new Map(prev)
                  const updated = {
                    ...skill,
                    status: 'completed' as const,
                    finalResult: event.result,
                    currentIteration: event.totalIterations
                  }
                  next.set(event.skillId, updated)
                  // Also update in tool calls
                  updateToolCallSkillProgress(currentToolCalls, event.skillId, updated)
                  setMessages(prevMessages => prevMessages.map(m =>
                    m.id === assistantId
                      ? { ...m, toolCalls: [...currentToolCalls] }
                      : m
                  ))
                  return next
                })
              } else if (event.type === 'skill_error') {
                // Skill execution error
                setActiveSkills(prev => {
                  const skill = prev.get(event.skillId)
                  if (!skill) return prev
                  const next = new Map(prev)
                  const updated = {
                    ...skill,
                    status: 'error' as const,
                    error: event.error,
                    currentIteration: event.iteration
                  }
                  next.set(event.skillId, updated)
                  // Also update in tool calls
                  updateToolCallSkillProgress(currentToolCalls, event.skillId, updated)
                  return next
                })
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
        const metadata: Record<string, unknown> = {}
        if (assistantToolCalls.length > 0) {
          metadata.toolCalls = assistantToolCalls
        }
        if (assistantUsage) {
          metadata.usage = assistantUsage
        }
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
      setSearchQuery(null) // Clear search query when stream ends
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
    setRateLimitInfo(null)
    setSearchQuery(null)
    setActiveSkills(new Map())
    setIsLoading(false)
    setConversationId(null)
    isFirstMessageRef.current = true
  }, [])

  const clearMcpErrors = useCallback(() => {
    setMcpErrors([])
  }, [])

  const clearRateLimitInfo = useCallback(() => {
    setRateLimitInfo(null)
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
        usage: m.metadata?.usage as MessageUsage | undefined,
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
    rateLimitInfo,
    searchQuery,
    conversationId,
    activeSkills,
    sendMessage,
    clearMessages,
    loadConversation,
    clearMcpErrors,
    clearRateLimitInfo,
  }
}
