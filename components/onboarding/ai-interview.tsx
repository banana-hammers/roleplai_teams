'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageBubble } from '@/components/chat/message-bubble'
import { TypingIndicator } from '@/components/chat/typing-indicator'

interface AIInterviewProps {
  onComplete: (messages: Array<{ role: string; content: string }>) => void
  onBack?: () => void
}

export function AIInterview({ onComplete, onBack }: AIInterviewProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasStartedRef = useRef(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(0)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/onboarding/interview',
    }),
  })

  // Check if chat is in progress (using string comparison to avoid type issues with AI SDK v5)
  const isInProgress = String(status) === 'streaming' || String(status) === 'in_progress'

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Track message count for new message animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setLastMessageCount(messages.length)
    }, 350) // Slightly longer than animation duration
    return () => clearTimeout(timer)
  }, [messages.length])

  // Start interview automatically (with guard for React Strict Mode)
  useEffect(() => {
    if (messages.length === 0 && !hasStartedRef.current) {
      hasStartedRef.current = true
      sendMessage({
        text: "Hi! I'm ready to start.",
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track question count and detect completion
  useEffect(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    setQuestionCount(assistantMessages.length)

    // Check if Nova is concluding (7+ questions or completion phrase)
    if (assistantMessages.length >= 7) {
      const lastMessage = assistantMessages[assistantMessages.length - 1]
      const content = lastMessage.parts
        .map(part => part.type === 'text' ? part.text : '')
        .join('')
        .toLowerCase()

      if (
        content.includes('have everything') ||
        content.includes('show you your identity') ||
        content.includes("that's all i need") ||
        assistantMessages.length >= 9
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

  const handleComplete = async () => {
    // Convert messages to simple format for storage
    const simpleMessages = messages.map(m => ({
      role: m.role,
      content: m.parts
        .map(part => part.type === 'text' ? part.text : '')
        .join(''),
    }))

    onComplete(simpleMessages)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          AI Personality Interview
        </h2>
        <p className="text-muted-foreground">
          Let's chat! I'll ask you a few questions to understand your personality.
        </p>
        <p className="text-sm text-muted-foreground">
          {questionCount === 0 ? 'Starting interview...' : `Question ${questionCount} of ~7`}
        </p>
      </div>

      {/* Chat messages */}
      <div className="space-y-4 max-h-96 overflow-y-auto rounded-lg border bg-muted/50 p-4">
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
              senderName={message.role === 'assistant' ? 'Nova' : undefined}
              isNew={isNew}
            />
          )
        })}

        {isInProgress && <TypingIndicator senderName="Nova" />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      {!isComplete && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
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
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100 text-center">
            Interview complete! Ready to see your identity profile.
          </div>
          <div className="flex justify-between gap-4">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button onClick={handleComplete} className="ml-auto">
              Continue to Identity Preview
            </Button>
          </div>
        </div>
      )}

      {/* Back button when interview not complete */}
      {!isComplete && onBack && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      )}
    </div>
  )
}
