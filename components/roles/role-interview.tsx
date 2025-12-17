'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface RoleInterviewProps {
  onComplete: (messages: Array<{ role: string; content: string }>) => void
  onBack?: () => void
}

export function RoleInterview({ onComplete, onBack }: RoleInterviewProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasStartedRef = useRef(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/roles/interview',
    }),
  })

  // Check if chat is in progress (using string comparison to avoid type issues with AI SDK v5)
  const isInProgress = String(status) === 'streaming' || String(status) === 'in_progress'

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Start interview automatically (with guard for React Strict Mode)
  useEffect(() => {
    if (messages.length === 0 && !hasStartedRef.current) {
      hasStartedRef.current = true
      sendMessage({
        text: "Hi! I'm ready to create my first role.",
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track question count and detect completion
  useEffect(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    setQuestionCount(assistantMessages.length)

    // Check if Forge is concluding (3+ questions or completion phrase)
    if (assistantMessages.length >= 3) {
      const lastMessage = assistantMessages[assistantMessages.length - 1]
      const content = lastMessage.parts
        .map(part => part.type === 'text' ? part.text : '')
        .join('')
        .toLowerCase()

      if (
        content.includes('let me put together') ||
        content.includes('config and suggest') ||
        content.includes('starter skills for you') ||
        content.includes("i'll generate") ||
        (content.includes('perfect!') && content.includes('so you want')) ||
        assistantMessages.length >= 6
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

  const handleComplete = useCallback(async () => {
    // Convert messages to simple format for storage
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
          Create Your Role
        </h2>
        <p className="text-muted-foreground">
          Tell Forge what kind of AI assistant you want to create.
        </p>
        <p className="text-sm text-muted-foreground">
          {questionCount === 0 ? 'Starting conversation...' : `Question ${questionCount} of ~5`}
        </p>
      </div>

      {/* Chat messages */}
      <div className="space-y-4 max-h-96 overflow-y-auto rounded-lg border bg-muted/50 p-4">
        {messages.map((message, index) => {
          const content = message.parts
            .map(part => part.type === 'text' ? part.text : '')
            .join('')

          return (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="text-xs font-semibold mb-1 text-muted-foreground">
                    Forge
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{content}</div>
              </div>
            </div>
          )
        })}

        {isInProgress && (
          <div className="flex justify-start">
            <div className="bg-background border rounded-lg px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      {!isComplete && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want your role to do..."
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
            Ready to generate your role configuration!
          </div>
          <div className="flex justify-between gap-4">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button onClick={handleComplete} className="ml-auto">
              Generate Role
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
