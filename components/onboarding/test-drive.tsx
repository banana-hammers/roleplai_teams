'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles } from 'lucide-react'
import type { IdentityCore } from '@/lib/onboarding/generate-identity'

interface TestDriveProps {
  identity: IdentityCore
  onConfirm: () => void
  onAdjust: () => void
}

const TEST_PROMPTS = [
  "Explain quantum computing to me",
  "Should I learn Python or JavaScript?",
  "Tell me about your creator",
  "What's the best way to learn a new skill?",
  "I'm not sure what to do next",
]

export function TestDrive({ identity, onConfirm, onAdjust }: TestDriveProps) {
  const [input, setInput] = useState('')
  const [messageCount, setMessageCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/onboarding/test-drive',
      body: { identity },
    }),
  })

  // Check if chat is in progress (using string comparison to avoid type issues with AI SDK v5)
  const isInProgress = String(status) === 'streaming' || String(status) === 'in_progress'

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Track user message count
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user')
    setMessageCount(userMessages.length)
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isInProgress) return

    sendMessage({ text: input })
    setInput('')
  }

  const handlePromptClick = (prompt: string) => {
    setInput(prompt)
  }

  const canConfirm = messageCount >= 2 // At least 2 exchanges

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Test Drive Your Identity
          </h2>
        </div>
        <p className="text-muted-foreground">
          Let's see how this feels! Ask me anything to test your new identity.
        </p>
      </div>

      {/* Suggested prompts (only show if no messages yet) */}
      {messages.length === 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Try asking me:</p>
          <div className="flex flex-wrap gap-2">
            {TEST_PROMPTS.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handlePromptClick(prompt)}
                className="text-xs"
              >
                "{prompt}"
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      <div className="space-y-4 max-h-96 overflow-y-auto rounded-lg border bg-muted/50 p-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Send a message to start testing your identity...
          </div>
        )}

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
                    Your AI
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
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
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

      {/* Confirmation section */}
      {canConfirm && (
        <div className="space-y-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm font-medium mb-2">How does this feel?</p>
            <p className="text-xs text-muted-foreground">
              You've tested your identity with {messageCount} {messageCount === 1 ? 'question' : 'questions'}.
              Ready to continue?
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onAdjust}
              className="flex-1"
            >
              ← Let me adjust
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1"
            >
              This feels right! ✓
            </Button>
          </div>
        </div>
      )}

      {/* Back button when not confirmed */}
      {!canConfirm && messages.length > 0 && (
        <div className="text-center text-xs text-muted-foreground">
          Try at least 2 questions to get a feel for your identity
        </div>
      )}
    </div>
  )
}
