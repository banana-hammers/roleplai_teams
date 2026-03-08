'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SlidersHorizontal, Loader2 } from 'lucide-react'
import { submitRefinement } from '@/app/actions/refinement'
import { useStatusMessage } from '@/lib/hooks/use-status-message'
import type { StyleProfile, CognitiveStyle } from '@/types/identity'

const QUICK_OPTIONS = [
  { label: 'Too formal', correction: 'The response was too formal. I prefer a more casual tone.' },
  { label: 'Too casual', correction: 'The response was too casual. I prefer a more professional tone.' },
  { label: 'Too verbose', correction: 'The response was too long and verbose. I prefer shorter, more concise responses.' },
  { label: 'Too brief', correction: 'The response was too brief. I prefer more detailed, thorough responses.' },
  { label: 'Wrong tone', correction: 'The tone of the response did not match my style.' },
  { label: 'Not my style', correction: 'This response does not sound like me at all.' },
]

interface RefinementPopoverProps {
  messageContent: string
  currentStyleProfile?: StyleProfile
  currentCognitiveStyle?: CognitiveStyle
}

export function RefinementPopover({
  messageContent,
  currentStyleProfile,
  currentCognitiveStyle,
}: RefinementPopoverProps) {
  const [loading, setLoading] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customText, setCustomText] = useState('')
  const { statusMessage: feedback, setStatusMessage: setFeedback } = useStatusMessage(2000)

  const handleCorrection = async (correction: string) => {
    setLoading(true)
    setFeedback(null)

    try {
      const analyzeResponse = await fetch('/api/identity/analyze-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correction,
          message_content: messageContent,
          current_style_profile: currentStyleProfile,
          current_cognitive_style: currentCognitiveStyle,
        }),
      })

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze correction')
      }

      const { field_updates } = await analyzeResponse.json()

      const result = await submitRefinement({
        correction,
        field_updates: field_updates || {},
        source: 'chat_feedback',
      })

      if (result.success) {
        setFeedback({ type: 'success', text: 'Identity updated' })
        setShowCustom(false)
        setCustomText('')
      } else {
        setFeedback({ type: 'error', text: result.error || 'Failed to save' })
      }
    } catch {
      setFeedback({ type: 'error', text: 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
          aria-label="Refine identity"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {feedback ? (
          <div className={`p-3 text-sm text-center ${feedback.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
            {feedback.text}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center p-4 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Updating identity...</span>
          </div>
        ) : showCustom ? (
          <div className="p-2 space-y-2">
            <Input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="What should change?"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customText.trim()) {
                  handleCorrection(customText.trim())
                }
              }}
              autoFocus
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={() => { setShowCustom(false); setCustomText('') }}
              >
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                disabled={!customText.trim()}
                onClick={() => handleCorrection(customText.trim())}
              >
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Refine your identity
            </div>
            {QUICK_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.label}
                onClick={() => handleCorrection(option.correction)}
                className="text-sm cursor-pointer"
              >
                {option.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); setShowCustom(true) }}
              className="text-sm cursor-pointer"
            >
              Custom feedback...
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
