'use client'

import { useState } from 'react'
import { Search, Globe, Wrench, Plug, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getToolMetadata, formatToolInput } from '@/lib/tools/tool-registry'

interface ToolResultCardProps {
  name: string
  input?: Record<string, unknown>
  result?: string
  status?: 'running' | 'completed' | 'error'
}

const ICON_MAP = {
  Search,
  Globe,
  Wrench,
  Plug,
} as const

const categoryBorderColors = {
  builtin: 'border-l-tool-builtin',
  skill: 'border-l-tool-skill',
  mcp: 'border-l-tool-mcp',
} as const

const categoryTextColors = {
  builtin: 'text-tool-builtin',
  skill: 'text-tool-skill',
  mcp: 'text-tool-mcp',
} as const

export function ToolResultCard({ name, input, result, status }: ToolResultCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const metadata = getToolMetadata(name)
  const Icon = ICON_MAP[metadata.icon]
  const inputSummary = formatToolInput(name, input)

  const inferredStatus: 'running' | 'completed' | 'error' = !result ? 'running' :
    (result.toLowerCase().startsWith('error') ||
     result.toLowerCase().startsWith('failed') ||
     result.includes('HTTP 4') ||
     result.includes('HTTP 5')) ? 'error' : 'completed'

  const displayStatus = status ?? inferredStatus
  const isLoading = displayStatus === 'running'
  const isError = displayStatus === 'error'

  return (
    <div className={cn(
      'border-l-2 rounded-r text-xs card-inset',
      categoryBorderColors[metadata.category]
    )}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', categoryTextColors[metadata.category])} />
          <span className={cn('font-medium', categoryTextColors[metadata.category])}>
            {metadata.displayName}
          </span>
          {inputSummary && (
            <>
              <span className="text-muted-foreground">-</span>
              <span className="text-muted-foreground truncate">{inputSummary}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : isError ? (
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5 text-success" />
          )}
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-2 space-y-2 border-t border-border/50 pt-2">
          <p className="text-muted-foreground italic">
            {metadata.description}
          </p>

          {input && Object.keys(input).length > 0 && (
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground">Input:</span>
              <div className="bg-black/5 dark:bg-white/5 rounded px-2 py-1 font-mono">
                {Object.entries(input).map(([key, value]) => (
                  <div key={key} className="truncate">
                    <span className="text-muted-foreground">{key}:</span>{' '}
                    <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground">Result:</span>
              <div className={cn(
                'rounded px-2 py-1',
                isError ? 'bg-destructive/10 text-destructive' : 'bg-black/5 dark:bg-white/5'
              )}>
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] max-h-48 overflow-y-auto">
                  {result}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
