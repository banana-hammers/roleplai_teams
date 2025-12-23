'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageBubble } from '@/components/chat/message-bubble'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import type {
  SkillInterviewMode,
  ExistingSkillContext,
  ForgeExtractedSkill,
} from '@/types/skill-creation'

interface SkillForgeInterviewProps {
  mode: SkillInterviewMode
  roleId: string
  existingSkill?: ExistingSkillContext
  onComplete: (skill: ForgeExtractedSkill) => void
  onCancel: () => void
}

export function SkillForgeInterview({
  mode,
  roleId,
  existingSkill,
  onComplete,
  onCancel,
}: SkillForgeInterviewProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasStartedRef = useRef(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/skills/interview',
      body: {
        mode,
        roleId,
        existingSkill,
      },
    }),
  })

  // Check if chat is in progress
  const isInProgress =
    String(status) === 'streaming' || String(status) === 'in_progress'

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Track message count for new message animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setLastMessageCount(messages.length)
    }, 350)
    return () => clearTimeout(timer)
  }, [messages.length])

  // Start interview automatically
  useEffect(() => {
    if (messages.length === 0 && !hasStartedRef.current) {
      hasStartedRef.current = true
      const initialMessage =
        mode === 'edit' && existingSkill
          ? `I want to update my "${existingSkill.name}" skill.`
          : "I want to create a new skill."
      sendMessage({ text: initialMessage })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track question count and detect completion
  useEffect(() => {
    const assistantMessages = messages.filter((m) => m.role === 'assistant')
    setQuestionCount(assistantMessages.length)

    // Check if Forge is concluding (2+ questions or completion phrase)
    if (assistantMessages.length >= 2) {
      const lastMessage = assistantMessages[assistantMessages.length - 1]
      const content = lastMessage.parts
        .map((part) => (part.type === 'text' ? part.text : ''))
        .join('')
        .toLowerCase()

      if (
        content.includes('let me generate') ||
        content.includes('ready to create') ||
        content.includes('skill definition') ||
        content.includes("i'll create") ||
        content.includes('ready to build') ||
        content.includes('apply these changes') ||
        content.includes("let me update") ||
        content.includes("i've got a clear picture") ||
        assistantMessages.length >= 5
      ) {
        setIsComplete(true)
      }
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isInProgress) return

    sendMessage({ text: input })
    setInput('')
  }

  const handleExtract = useCallback(async () => {
    setIsExtracting(true)
    setExtractionError(null)

    try {
      // Convert messages to simple format
      const simpleMessages = messages.map((m) => ({
        role: m.role,
        content: m.parts
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join(''),
      }))

      const response = await fetch('/api/skills/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: simpleMessages,
          mode,
          existingSkill,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to extract skill')
      }

      const result = await response.json()

      if (result.success && result.skill) {
        onComplete(result.skill)
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Extraction error:', error)
      setExtractionError(
        error instanceof Error ? error.message : 'Failed to extract skill'
      )
    } finally {
      setIsExtracting(false)
    }
  }, [messages, mode, existingSkill, onComplete])

  return (
    <div className="flex flex-col h-full">
      {/* Mobile header with close button */}
      <div className="flex items-center justify-between p-4 border-b sm:hidden">
        <h3 className="text-lg font-semibold">
          {mode === 'edit' ? 'Edit Skill' : 'Create Skill'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop header */}
      <div className="hidden sm:block space-y-1 pb-4 border-b">
        <h3 className="text-lg font-semibold">
          {mode === 'edit' ? 'Edit Skill with Forge' : 'Create Skill with Forge'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {mode === 'edit'
            ? 'Tell Forge what you want to change.'
            : 'Describe the skill you want to create.'}
        </p>
        <p className="text-xs text-muted-foreground">
          {questionCount === 0
            ? 'Starting conversation...'
            : `Exchange ${questionCount} of ~3`}
        </p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto py-4 px-4 sm:px-0 space-y-4 min-h-0">
        {messages.map((message, index) => {
          const content = message.parts
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join('')

          const isNew = index >= lastMessageCount

          return (
            <MessageBubble
              key={index}
              role={message.role as 'user' | 'assistant'}
              content={content}
              senderName={message.role === 'assistant' ? 'Forge' : undefined}
              isNew={isNew}
            />
          )
        })}

        {isInProgress && <TypingIndicator senderName="Forge" />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form or complete button */}
      <div className="p-4 sm:pt-4 sm:px-0 sm:pb-0 border-t space-y-3">
        {extractionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
            {extractionError}
          </div>
        )}

        {!isComplete ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'edit'
                  ? 'What do you want to change?'
                  : 'Describe what the skill should do...'
              }
              disabled={isInProgress}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" disabled={!input.trim() || isInProgress}>
              Send
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100 text-center">
              Ready to generate your skill!
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={onCancel} disabled={isExtracting}>
                Cancel
              </Button>
              <Button onClick={handleExtract} disabled={isExtracting}>
                {isExtracting ? 'Generating...' : 'Generate & Fill Form'}
              </Button>
            </div>
          </div>
        )}

        {!isComplete && (
          <div className="flex justify-start">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
