'use client'

import { InterviewChat } from '@/components/chat/interview-chat'

interface AIInterviewProps {
  onComplete: (messages: Array<{ role: string; content: string }>) => void
  onBack?: () => void
}

export function AIInterview({ onComplete, onBack }: AIInterviewProps) {
  return (
    <InterviewChat
      endpoint="/api/onboarding/interview"
      assistantName="Nova"
      onComplete={onComplete}
      onBack={onBack}
      initialMessage="Hi! I'm ready to start."
      title="AI Personality Interview"
      subtitle="Let's chat! I'll ask you a few questions to understand your personality."
      estimatedQuestions="~7"
      startingLabel="Starting interview..."
      inputPlaceholder="Type your answer..."
      completionMessage="Interview complete! Ready to see your identity profile."
      completeButtonLabel="Continue to Identity Preview"
      completionConfig={{
        minMessages: 7,
        maxMessages: 9,
        completionPhrases: [
          'have everything',
          'show you your identity',
          "that's all i need",
        ],
      }}
    />
  )
}
