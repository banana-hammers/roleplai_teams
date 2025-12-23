'use client'

import { useState } from 'react'
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { ToolResultCard } from './tool-result-card'
import type { SkillProgress } from '@/lib/hooks/use-role-chat'

interface SkillProgressCardProps {
  progress: SkillProgress
}

export function SkillProgressCard({ progress }: SkillProgressCardProps) {
  const [isOpen, setIsOpen] = useState(true)

  // Determine icon based on status
  const statusIcon = {
    running: <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />,
    completed: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
    error: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  }

  return (
    <div className="border-l-2 border-purple-500 rounded-r text-xs bg-purple-50/50 dark:bg-purple-950/20">
      {/* Header - clickable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Wrench className="h-3.5 w-3.5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
          <span className="font-medium text-purple-600 dark:text-purple-400">
            {progress.skillName}
          </span>
          {progress.status === 'running' && (
            <span className="text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Iteration {progress.currentIteration}/{progress.maxIterations}
            </span>
          )}
          {progress.status === 'completed' && (
            <span className="text-muted-foreground">
              Completed in {progress.currentIteration} iteration{progress.currentIteration !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {statusIcon[progress.status]}
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-3 border-t border-purple-200 dark:border-purple-800 pt-2">
          {/* Streaming text output */}
          {progress.streamingText && (
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground">Output:</span>
              <div className="bg-white/50 dark:bg-black/20 rounded px-2 py-1.5">
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] max-h-48 overflow-y-auto">
                  {progress.streamingText}
                  {progress.status === 'running' && (
                    <span className="animate-pulse text-purple-500">|</span>
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* Nested tool calls */}
          {progress.toolCalls.length > 0 && (
            <div className="space-y-2">
              <span className="font-medium text-muted-foreground">
                Tool Calls ({progress.toolCalls.length})
              </span>
              <div className="ml-2 space-y-2">
                {progress.toolCalls.map((toolCall, index) => (
                  <div key={toolCall.toolId || index} className="relative">
                    {/* Connection line */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-purple-300 dark:bg-purple-700 -ml-2" />
                    <div className="absolute left-0 top-3 w-2 h-px bg-purple-300 dark:bg-purple-700 -ml-2" />
                    <ToolResultCard
                      name={toolCall.toolName}
                      input={toolCall.input}
                      result={toolCall.result}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final result (only show if different from streaming text) */}
          {progress.status === 'completed' && progress.finalResult && progress.finalResult !== progress.streamingText && (
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground">Final Result:</span>
              <div className="bg-green-100 dark:bg-green-950/30 rounded px-2 py-1.5">
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] max-h-32 overflow-y-auto">
                  {progress.finalResult}
                </pre>
              </div>
            </div>
          )}

          {/* Error message */}
          {progress.status === 'error' && progress.error && (
            <div className="space-y-1">
              <span className="font-medium text-red-500">Error:</span>
              <div className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded px-2 py-1.5">
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px]">
                  {progress.error}
                </pre>
              </div>
            </div>
          )}

          {/* Empty state when running with no content yet */}
          {progress.status === 'running' && !progress.streamingText && progress.toolCalls.length === 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Starting skill execution...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
