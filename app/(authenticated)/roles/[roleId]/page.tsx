'use client'

import { useState, useRef, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRoleChat } from '@/lib/hooks/use-role-chat'
import { getRole, getRoleSkills } from '@/app/actions/roles'
import { getModelTier, getModelDisplayName } from '@/lib/utils/model-tiers'
import { Loader2, Send, ArrowLeft, Wrench, Settings, Menu, AlertTriangle, X } from 'lucide-react'
import { MessageBubble } from '@/components/chat/message-bubble'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import { ConversationList } from '@/components/chat/conversation-list'
import { TierAvatar } from '@/components/roles/tier-avatar'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/role'
import type { Skill } from '@/types/skill'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

interface RoleChatPageProps {
  params: Promise<{ roleId: string }>
}

// Generate conversation starters based on skills
function getConversationStarters(skills: Skill[], _role: Role): string[] {
  const starters: string[] = []

  // Skill-based starters
  for (const skill of skills) {
    const name = skill.name.toLowerCase()
    if (name.includes('search') || name.includes('web')) {
      starters.push('Search the web for the latest news about AI')
    } else if (name.includes('analyze') || name.includes('analysis')) {
      starters.push(`Help me analyze something`)
    } else if (name.includes('draft') || name.includes('write')) {
      starters.push('Help me draft a message')
    } else if (name.includes('code') || name.includes('program')) {
      starters.push('Help me write some code')
    }
  }

  // Generic starters
  starters.push(`What can you help me with?`)
  starters.push('Tell me about your capabilities')

  // Return unique starters, max 4
  return [...new Set(starters)].slice(0, 4)
}

export default function RoleChatPage({ params }: RoleChatPageProps) {
  const { roleId } = use(params)
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [input, setInput] = useState('')
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleConversationCreated = useCallback((id: string) => {
    setActiveConversationId(id)
  }, [])

  const { messages, isLoading: isChatLoading, error, mcpErrors, conversationId, sendMessage, clearMessages, loadConversation, clearMcpErrors } = useRoleChat({
    roleId,
    conversationId: activeConversationId || undefined,
    onConversationCreated: handleConversationCreated,
  })

  // Sync conversationId from hook to state
  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversationId(conversationId)
    }
  }, [conversationId, activeConversationId])

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id)
    await loadConversation(id)
    setShowMobileSidebar(false)
  }, [loadConversation])

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null)
    clearMessages()
    setShowMobileSidebar(false)
  }, [clearMessages])

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

  const handleStarterClick = (starter: string) => {
    sendMessage(starter)
  }

  const handleSkillClick = (skillName: string) => {
    setInput(`Use ${skillName} to `)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="relative">
          <div className="h-12 w-12 rounded-xl bg-primary/20 animate-[orb-breathe_2s_ease-in-out_infinite]" />
          <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!role) {
    return null
  }

  const tierConfig = getModelTier(role.model_preference)
  const modelLabel = getModelDisplayName(role.model_preference)
  const conversationStarters = getConversationStarters(skills, role)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Compact Header */}
      <header className={cn(
        'sticky top-0 z-50',
        'border-b bg-background/80 backdrop-blur-xl',
        'supports-backdrop-filter:bg-background/60',
      )}>
        <div className="flex h-14 items-center gap-3 px-4">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/roles')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Mobile sidebar trigger */}
          <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <ConversationList
                roleId={roleId}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
              />
            </SheetContent>
          </Sheet>

          {/* Role avatar with online indicator */}
          <TierAvatar tier={tierConfig} size="sm" showOnlineIndicator />

          {/* Role info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">{role.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {modelLabel && <span>{modelLabel}</span>}
              {skills.length > 0 && (
                <>
                  <span>·</span>
                  <span>{skills.length} skill{skills.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/roles/${roleId}/settings`)}
            className="h-9 w-9"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 border-r bg-background flex-col">
          <ConversationList
            roleId={roleId}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Card className="flex-1 flex flex-col m-4 overflow-hidden">
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              {/* MCP Server Errors Banner */}
              {mcpErrors.length > 0 && (
                <div className="flex items-start gap-2 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                      Some MCP servers unavailable:
                    </span>
                    <span className="text-yellow-600/80 dark:text-yellow-400/80 ml-1">
                      {mcpErrors.map(e => e.server).join(', ')}
                    </span>
                  </div>
                  <button
                    onClick={clearMcpErrors}
                    className="text-yellow-500 hover:text-yellow-600 p-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Empty state with conversation starters */}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full py-8 px-4">
                    {/* Animated role avatar */}
                    <div className="relative mb-6">
                      <TierAvatar tier={tierConfig} size="xl" />
                    </div>

                    <h3 className="font-display text-xl font-semibold text-center mb-2">
                      Start chatting with {role.name}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
                      {role.description || 'Ready to help you with anything you need.'}
                    </p>

                    {/* Conversation starters */}
                    <div className="w-full max-w-sm space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 text-center">
                        Try asking
                      </p>
                      {conversationStarters.map((starter, i) => (
                        <button
                          key={i}
                          onClick={() => handleStarterClick(starter)}
                          className={cn(
                            'w-full p-3 rounded-xl text-left',
                            'bg-muted/50 hover:bg-muted',
                            'border border-transparent hover:border-border',
                            'text-sm transition-all duration-200',
                            'hover:translate-x-1',
                            'animate-slide-up-fade',
                          )}
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <span className="text-primary mr-2">→</span>
                          {starter}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
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
                              className="text-xs bg-blue-500/10 rounded-lg p-2 border-l-2 border-blue-500"
                            >
                              <div className="flex items-center gap-1 font-medium text-blue-400">
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
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Floating input area */}
              <div className={cn(
                'border-t p-4',
                'bg-linear-to-t from-background via-background to-transparent',
              )}>
                {/* Skill suggestions when input is empty */}
                {!input && skills.length > 0 && messages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 justify-center">
                    {skills.slice(0, 3).map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => handleSkillClick(skill.name)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                          'bg-skills-accent/10 text-skills-accent',
                          'text-xs font-medium',
                          'hover:bg-skills-accent/20 transition-colors',
                          'border border-skills-accent/20',
                        )}
                      >
                        <Wrench className="h-3 w-3" />
                        {skill.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input form */}
                <form onSubmit={handleSubmit} className="relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={isChatLoading}
                    className={cn(
                      'pr-12 h-12 rounded-2xl',
                      'bg-muted/50 border-muted',
                      'focus:bg-background focus:border-primary',
                      'transition-all duration-200',
                    )}
                    autoFocus
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isChatLoading}
                    size="icon"
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2',
                      'h-8 w-8 rounded-xl',
                      'transition-all duration-200',
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
