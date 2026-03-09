'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageBubble } from '@/components/chat/message-bubble'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import { SkipForward } from 'lucide-react'

interface CompletionConfig {
  /** Minimum assistant messages before checking for completion */
  minMessages: number
  /** Force complete at this many assistant messages */
  maxMessages: number
  /** Phrases in last assistant message that trigger completion */
  completionPhrases: string[]
  /** Optional custom check for complex completion conditions */
  customCheck?: (content: string) => boolean
}

interface InterviewChatProps {
  /** API endpoint for the chat transport */
  endpoint: string
  /** Display name for the assistant (e.g. "Nova", "Forge") */
  assistantName: string
  /** Called when interview completes with simplified messages */
  onComplete: (messages: Array<{ role: string; content: string }>) => void
  /** Optional back button handler */
  onBack?: () => void
  /** Optional skip handler (renders skip button in footer) */
  onSkip?: () => void
  /** Label for the skip button */
  skipLabel?: string
  /** Initial message sent to start the interview */
  initialMessage: string
  /** Header title */
  title: string
  /** Header subtitle */
  subtitle: string
  /** Approximate question count shown in progress (e.g. "~7") */
  estimatedQuestions: string
  /** Label shown when starting (before first response) */
  startingLabel?: string
  /** Input placeholder text */
  inputPlaceholder?: string
  /** Completion banner message */
  completionMessage: string
  /** Complete button label */
  completeButtonLabel: string
  /** Configuration for detecting interview completion */
  completionConfig: CompletionConfig
}

export function InterviewChat({
  endpoint,
  assistantName,
  onComplete,
  onBack,
  onSkip,
  skipLabel,
  initialMessage,
  title,
  subtitle,
  estimatedQuestions,
  startingLabel = 'Starting conversation...',
  inputPlaceholder = 'Type your answer...',
  completionMessage,
  completeButtonLabel,
  completionConfig,
}: InterviewChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasStartedRef = useRef(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(0)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: endpoint,
    }),
  })

  const isInProgress = String(status) === 'streaming' || String(status) === 'in_progress'

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

  // Start interview automatically (with guard for React Strict Mode)
  useEffect(() => {
    if (messages.length === 0 && !hasStartedRef.current) {
      hasStartedRef.current = true
      sendMessage({ text: initialMessage })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track question count and detect completion
  useEffect(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deriving count from messages
    setQuestionCount(assistantMessages.length)

    if (assistantMessages.length >= completionConfig.minMessages) {
      const lastMessage = assistantMessages[assistantMessages.length - 1]
      const content = lastMessage.parts
        .map(part => part.type === 'text' ? part.text : '')
        .join('')
        .toLowerCase()

      const hasCompletionPhrase = completionConfig.completionPhrases.some(
        phrase => content.includes(phrase)
      )
      const hasCustomMatch = completionConfig.customCheck?.(content) ?? false

      if (hasCompletionPhrase || hasCustomMatch || assistantMessages.length >= completionConfig.maxMessages) {
        setIsComplete(true)
      }
    }
  }, [messages, completionConfig])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isInProgress) return

    sendMessage({ text: input })
    setInput('')
  }

  const handleComplete = useCallback(() => {
    const simpleMessages = messages.map(m => ({
      role: m.role,
      content: m.parts
        .map(part => part.type === 'text' ? part.text : '')
        .join(''),
    }))

    onComplete(simpleMessages)
  }, [messages, onComplete])

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-muted-foreground">
          {subtitle}
        </p>
        <p className="text-sm text-muted-foreground">
          {questionCount === 0 ? startingLabel : `Question ${questionCount} of ${estimatedQuestions}`}
        </p>
      </div>

      {/* Chat messages */}
      <div className="space-y-4 max-h-[40vh] md:max-h-[50vh] overflow-y-auto rounded-lg border bg-muted/50 p-4">
        {messages.map((message, index) => {
          const content = message.parts
            .map(part => part.type === 'text' ? part.text : '')
            .join('')

          const isNew = index >= lastMessageCount

          return (
            <MessageBubble
              key={index}
              role={message.role as 'user' | 'assistant'}
              content={content}
              senderName={message.role === 'assistant' ? assistantName : undefined}
              isNew={isNew}
            />
          )
        })}

        {isInProgress && <TypingIndicator senderName={assistantName} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      {!isComplete && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={inputPlaceholder}
            disabled={isInProgress}
            className="flex-1"
            autoFocus
          />
          <Button
            type="submit"
            disabled={!input.trim() || isInProgress}
          >
            Send
          </Button>
        </form>
      )}

      {/* Complete button */}
      {isComplete && (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success text-center">
            {completionMessage}
          </div>
          <div className="flex justify-between gap-4">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button onClick={handleComplete} className="ml-auto">
              {completeButtonLabel}
            </Button>
          </div>
        </div>
      )}

      {/* Footer buttons when interview not complete */}
      {!isComplete && (onBack || onSkip) && (
        <div className="flex items-center justify-between">
          {onBack ? (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          ) : <div />}
          {onSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              {skipLabel || 'Skip'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
