'use client'

import { InterviewChat } from '@/components/chat/interview-chat'

interface LoremasterInterviewProps {
  onComplete: (messages: Array<{ role: string; content: string }>) => void
  onBack?: () => void
  onSkip: () => void
}

export function LoremasterInterview({ onComplete, onBack, onSkip }: LoremasterInterviewProps) {
  return (
    <InterviewChat
      endpoint="/api/onboarding/loremaster"
      assistantName="Loremaster"
      onComplete={onComplete}
      onBack={onBack}
      onSkip={onSkip}
      skipLabel="Skip — I'll add company details later"
      initialMessage="Hi! I'm ready to tell you about my company."
      title="Company Interview"
      subtitle="The Loremaster will learn about your company, founders, and business model."
      estimatedQuestions="~5"
      startingLabel="Starting interview..."
      inputPlaceholder="Tell the Loremaster about your company..."
      completionMessage="Interview complete! Let's review what I've captured."
      completeButtonLabel="Review Company Lore"
      completionConfig={{
        minMessages: 4,
        maxMessages: 8,
        completionPhrases: [
          'got everything i need',
          "story's locked in",
          'have what i need',
          'got the full picture',
          'that wraps it up',
          'have a clear picture',
        ],
      }}
    />
  )
}
