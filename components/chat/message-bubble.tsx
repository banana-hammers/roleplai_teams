'use client'

import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { AIAvatar } from './ai-avatar'

export interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  senderName?: string
  isNew?: boolean
  className?: string
}

export const MessageBubble = memo(function MessageBubble({
  role,
  content,
  senderName,
  isNew = false,
  className,
}: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start',
        isNew && 'animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-300',
        className
      )}
    >
      {/* AI Avatar for assistant messages */}
      {!isUser && <AIAvatar state="idle" size="sm" className="mt-1" />}

      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          'shadow-md hover:shadow-lg transition-all duration-200',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-background via-muted/30 to-muted/50 border'
        )}
      >
        {/* Sender name for assistant */}
        {!isUser && senderName && (
          <div className="text-xs font-semibold mb-1.5 text-muted-foreground">
            {senderName}
          </div>
        )}

        {/* Markdown content */}
        <div className={cn('text-sm', isUser ? 'text-primary-foreground' : 'text-foreground')}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="whitespace-pre-wrap mb-2 last:mb-0">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              code: ({ children, className }) => {
                const isInline = !className
                return isInline ? (
                  <code className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-mono',
                    isUser ? 'bg-primary-foreground/20' : 'bg-muted/70'
                  )}>
                    {children}
                  </code>
                ) : (
                  <code className="text-xs font-mono">{children}</code>
                )
              },
              pre: ({ children }) => (
                <pre className={cn(
                  'p-3 rounded-lg overflow-x-auto my-2 text-xs',
                  isUser ? 'bg-primary-foreground/10' : 'bg-muted/50'
                )}>
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className={cn(
                    'underline underline-offset-2 hover:no-underline',
                    isUser ? 'text-primary-foreground' : 'text-primary'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className={cn(
                  'border-l-2 pl-3 my-2 italic',
                  isUser ? 'border-primary-foreground/50' : 'border-primary/50'
                )}>
                  {children}
                </blockquote>
              ),
              hr: () => (
                <hr className={cn(
                  'my-3',
                  isUser ? 'border-primary-foreground/30' : 'border-border'
                )} />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
})
