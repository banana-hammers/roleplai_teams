'use client'

import { useState, useRef, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRoleChat } from '@/lib/hooks/use-role-chat'
import { getRole, getRoleSkills } from '@/app/actions/roles'
import { Loader2, Send, ArrowLeft, Wrench } from 'lucide-react'
import { MessageBubble } from '@/components/chat/message-bubble'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import type { Role } from '@/types/role'
import type { Skill } from '@/types/skill'

interface RoleChatPageProps {
  params: Promise<{ roleId: string }>
}

export default function RoleChatPage({ params }: RoleChatPageProps) {
  const { roleId } = use(params)
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [input, setInput] = useState('')
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, isLoading: isChatLoading, error, sendMessage, clearMessages } = useRoleChat({
    roleId,
  })

  // Load role and skills
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [roleResult, skillsResult] = await Promise.all([
        getRole(roleId),
        getRoleSkills(roleId),
      ])

      if (roleResult.success && roleResult.role) {
        setRole(roleResult.role as Role)
      } else {
        // Role not found - redirect
        router.push('/roles/create')
        return
      }

      if (skillsResult.success) {
        setSkills(skillsResult.skills as Skill[])
      }

      setIsLoading(false)
    }

    loadData()
  }, [roleId, router])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isChatLoading) return

    sendMessage(input.trim())
    setInput('')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!role) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">{role.name}</h1>
            <p className="text-xs text-muted-foreground truncate max-w-md">
              {role.description}
            </p>
          </div>
          {skills.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {skills.length} skill{skills.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 container px-4 py-4">
        <Card className="h-[calc(100vh-12rem)] flex flex-col">
          <CardContent className="flex-1 overflow-hidden p-0">
            {/* Messages */}
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Chat with {role.name}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Start a conversation to use this role's skills and capabilities.
                    </p>
                  </div>
                  {skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Available skills:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {skills.map((skill) => (
                          <Badge key={skill.id} variant="secondary" className="text-xs">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {messages.map((message, index) => {
                const isNew = index >= lastMessageCount

                return (
                  <div key={message.id}>
                    <MessageBubble
                      role={message.role as 'user' | 'assistant'}
                      content={message.content}
                      senderName={message.role === 'assistant' ? role.name : undefined}
                      isNew={isNew}
                    />

                    {/* Tool calls */}
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="ml-12 mt-2 space-y-1">
                        {message.toolCalls.map((tc, i) => (
                          <div
                            key={i}
                            className="text-xs bg-blue-50/50 dark:bg-blue-950/20 rounded-r p-2 border-l-2 border-blue-500"
                          >
                            <div className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                              <Wrench className="h-3 w-3" />
                              {tc.name}
                            </div>
                            {tc.result && (
                              <div className="mt-1 text-muted-foreground truncate">
                                {tc.result.slice(0, 100)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {isChatLoading && <TypingIndicator senderName={role.name} />}

              {error && (
                <div className="flex justify-center">
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
                    {error}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          {/* Input form */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${role.name}...`}
                disabled={isChatLoading}
                className="flex-1"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!input.trim() || isChatLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </main>
    </div>
  )
}
