'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRoleChat, type Message as RoleMessage } from '@/lib/hooks/use-role-chat'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface ChatInterfaceProps {
  roleId?: string
  roleName?: string
}

export function ChatInterface({ roleId, roleName }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')

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

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`max-w-[80%] p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">
                    {message.role === 'user' ? 'You' : roleName || 'Assistant'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {/* Handle role chat messages */}
                    {isRoleChat && (message as RoleMessage).content}

                    {/* Handle basic chat messages with parts */}
                    {!isRoleChat && 'parts' in message && message.parts.map((part, index) => {
                      if (part.type === 'text') {
                        return <span key={index}>{part.text}</span>
                      }
                      return null
                    })}
                  </div>

                  {/* Tool calls display (role chat only) */}
                  {isRoleChat && (message as RoleMessage).toolCalls && (message as RoleMessage).toolCalls!.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {(message as RoleMessage).toolCalls!.map((tool, index) => (
                        <div
                          key={index}
                          className="border-l-2 border-blue-500 pl-3 py-1 text-xs"
                        >
                          <div className="font-medium text-blue-600">
                            Skill: {tool.name}
                          </div>
                          {tool.result && (
                            <div className="mt-1 text-muted-foreground bg-blue-50 p-2 rounded">
                              {tool.result}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-4 bg-muted">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:0.2s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:0.4s]" />
              </div>
            </Card>
          </div>
        )}

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
