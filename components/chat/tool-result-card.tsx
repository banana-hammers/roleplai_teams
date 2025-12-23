'use client'

import { useState } from 'react'
import { Search, Globe, Wrench, Plug, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { getToolMetadata, formatToolInput } from '@/lib/tools/tool-registry'

interface ToolResultCardProps {
  name: string
  input?: Record<string, unknown>
  result?: string
  /** Explicit status - if provided, takes precedence over inferred status */
  status?: 'running' | 'completed' | 'error'
}

const ICON_MAP = {
  Search,
  Globe,
  Wrench,
  Plug,
} as const

export function ToolResultCard({ name, input, result, status }: ToolResultCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const metadata = getToolMetadata(name)
  const Icon = ICON_MAP[metadata.icon]
  const inputSummary = formatToolInput(name, input)

  // Use explicit status if provided, otherwise infer from result
  const inferredStatus: 'running' | 'completed' | 'error' = !result ? 'running' :
    (result.toLowerCase().startsWith('error') ||
     result.toLowerCase().startsWith('failed') ||
     result.includes('HTTP 4') ||
     result.includes('HTTP 5')) ? 'error' : 'completed'

  const displayStatus = status ?? inferredStatus
  const isLoading = displayStatus === 'running'
  const isError = displayStatus === 'error'

  // Category-based colors
  const categoryColors = {
    builtin: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
    skill: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20',
    mcp: 'border-green-500 bg-green-50/50 dark:bg-green-950/20',
  }

  const iconColors = {
    builtin: 'text-blue-600 dark:text-blue-400',
    skill: 'text-purple-600 dark:text-purple-400',
    mcp: 'text-green-600 dark:text-green-400',
  }

  return (
    <div className={`border-l-2 rounded-r text-xs ${categoryColors[metadata.category]}`}>
      {/* Header - clickable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${iconColors[metadata.category]}`} />
          <span className={`font-medium ${iconColors[metadata.category]}`}>
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
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          )}
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="px-3 pb-2 space-y-2 border-t border-black/5 dark:border-white/5 pt-2">
          {/* Description */}
          <p className="text-muted-foreground italic">
            {metadata.description}
          </p>

          {/* Full input if available */}
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

          {/* Result */}
          {result && (
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground">Result:</span>
              <div className={`rounded px-2 py-1 ${isError ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300' : 'bg-black/5 dark:bg-white/5'}`}>
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
