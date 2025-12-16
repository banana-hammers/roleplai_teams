import { ChatInterface } from '@/components/chat/chat-interface'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ChatPage() {
  return (
    <div className="container mx-auto h-screen max-w-5xl p-4">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>AI Chat</CardTitle>
          <CardDescription>
            Test the basic chat interface (no role or identity context)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="h-full border rounded-lg">
            <ChatInterface />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
