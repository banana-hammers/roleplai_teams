'use client'

import { InterviewChat } from '@/components/chat/interview-chat'

interface RoleInterviewProps {
  onComplete: (messages: Array<{ role: string; content: string }>) => void
  onBack?: () => void
}

export function RoleInterview({ onComplete, onBack }: RoleInterviewProps) {
  return (
    <InterviewChat
      endpoint="/api/roles/interview"
      assistantName="Nova"
      onComplete={onComplete}
      onBack={onBack}
      initialMessage="Hi! I'm ready to create my first role."
      title="Create Your Role"
      subtitle="Tell Nova what kind of AI assistant you want to create."
      estimatedQuestions="~5"
      startingLabel="Starting conversation..."
      inputPlaceholder="Describe what you want your role to do..."
      completionMessage="Ready to generate your role configuration!"
      completeButtonLabel="Generate Role"
      completionConfig={{
        minMessages: 3,
        maxMessages: 6,
        completionPhrases: [
          'i have a clear picture',
          'i can see what you',
          'let me put together',
          "i'll create",
        ],
        customCheck: (content) =>
          content.includes('that makes sense') && content.includes('so you want'),
      }}
    />
  )
}
