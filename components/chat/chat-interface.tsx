'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRoleChat, type Message as RoleMessage } from '@/lib/hooks/use-role-chat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { MessageBubble } from '@/components/chat/message-bubble'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import { ToolResultCard } from '@/components/chat/tool-result-card'

interface ChatInterfaceProps {
  roleId?: string
  roleName?: string
}

export function ChatInterface({ roleId, roleName }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const [lastMessageCount, setLastMessageCount] = useState(0)

  // Use role-specific hook for role chat, standard useChat for basic chat
  const roleChat = useRoleChat({ roleId: roleId || '' })
  const basicChat = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { provider: 'anthropic' },
    }),
  })

  // Select the appropriate chat state based on whether we have a roleId
  const isRoleChat = !!roleId
  const messages = isRoleChat ? roleChat.messages : basicChat.messages
  const isLoading = isRoleChat ? roleChat.isLoading : (basicChat.status === 'streaming' || basicChat.status === 'submitted')
  const error = isRoleChat ? roleChat.error : basicChat.error?.message

  // Track message count for new message animations
  useEffect(() => {
    const timer = setTimeout(() => {
      setLastMessageCount(messages.length)
    }, 350)
    return () => clearTimeout(timer)
  }, [messages.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    if (isRoleChat) {
      roleChat.sendMessage(inputValue)
    } else {
      basicChat.sendMessage({ text: inputValue })
    }
    setInputValue('')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="text-lg font-semibold">
            {roleName ? `Chat as ${roleName}` : 'Chat'}
          </h2>
          {roleId && (
            <p className="text-sm text-muted-foreground">
              Using identity core + role context
            </p>
          )}
        </div>
        <Badge variant="outline">Claude</Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm mt-1">
                {roleId
                  ? 'This chat will use your identity core and role settings'
                  : 'Send a message to get started'
                }
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          // Extract content based on chat type
          const content = isRoleChat
            ? (message as RoleMessage).content
            : 'parts' in message
              ? message.parts.map(part => part.type === 'text' ? part.text : '').join('')
              : ''

          const isNew = index >= lastMessageCount
          const senderName = message.role === 'user' ? undefined : (roleName || 'Assistant')
          const formattedCost = isRoleChat ? (message as RoleMessage).usage?.formattedCost : undefined

          return (
            <div key={message.id}>
              <MessageBubble
                role={message.role as 'user' | 'assistant'}
                content={content}
                senderName={senderName}
                isNew={isNew}
                formattedCost={formattedCost}
              />

              {/* Tool calls display (role chat only) */}
              {isRoleChat && (message as RoleMessage).toolCalls && (message as RoleMessage).toolCalls!.length > 0 && (
                <div className="ml-12 mt-2 space-y-2">
                  {(message as RoleMessage).toolCalls!.map((tool, toolIndex) => (
                    <ToolResultCard
                      key={toolIndex}
                      name={tool.name}
                      input={tool.input}
                      result={tool.result}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {isLoading && <TypingIndicator senderName={roleName || 'Assistant'} />}

        {error && (
          <div className="flex justify-center">
            <Card className="border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                Error: {error}
              </p>
            </Card>
          </div>
        )}
      </div>

      <Separator />

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as any)
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            Send
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}
