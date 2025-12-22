'use client'

import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { AIAvatar } from './ai-avatar'
import { User } from 'lucide-react'

export interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  senderName?: string
  isNew?: boolean
  className?: string
  formattedCost?: string
}

export const MessageBubble = memo(function MessageBubble({
  role,
  content,
  senderName,
  isNew = false,
  className,
  formattedCost,
}: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className={cn(
        'flex gap-4 py-3',
        isNew && 'animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      {/* Avatar column - fixed width */}
      <div className="shrink-0 w-8">
        {isUser ? (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        ) : (
          <AIAvatar state="idle" size="sm" />
        )}
      </div>

      {/* Content column - flexible */}
      <div className="flex-1 min-w-0">
        {/* Sender name */}
        <div className="text-sm font-medium mb-1.5 text-foreground">
          {isUser ? 'You' : senderName || 'Assistant'}
        </div>

        {/* Markdown content */}
        <div className="text-sm text-foreground">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="whitespace-pre-wrap mb-3 last:mb-0 leading-relaxed">{children}</p>
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
                  <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">
                    {children}
                  </code>
                ) : (
                  <code className="text-sm font-mono">{children}</code>
                )
              },
              pre: ({ children }) => (
                <pre className="p-4 rounded-lg overflow-x-auto my-3 bg-muted text-sm">
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary underline underline-offset-2 hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside my-3 space-y-1.5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside my-3 space-y-1.5">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary/50 pl-4 my-3 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
              hr: () => (
                <hr className="my-4 border-border" />
              ),
              h1: ({ children }) => (
                <h1 className="text-xl font-semibold mt-4 mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold mt-3 mb-1.5">{children}</h3>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Cost badge for assistant messages */}
        {!isUser && formattedCost && (
          <div className="mt-2 text-[10px] text-muted-foreground font-mono">
            {formattedCost}
          </div>
        )}
      </div>
    </div>
  )
})
