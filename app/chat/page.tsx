import { ChatInterface } from '@/components/chat/chat-interface'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ChatPage() {
  return (
    <div className="container mx-auto h-screen max-w-5xl p-4">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>AI Chat</CardTitle>
          <CardDescription>
            Test the chat interface with different providers
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="anthropic" className="h-full flex flex-col">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="anthropic">Anthropic (Claude)</TabsTrigger>
              <TabsTrigger value="openai">OpenAI (GPT)</TabsTrigger>
            </TabsList>

            <TabsContent value="anthropic" className="flex-1 mt-4">
              <div className="h-full border rounded-lg">
                <ChatInterface
                  provider="anthropic"
                  model="claude-3-5-sonnet-20241022"
                />
              </div>
            </TabsContent>

            <TabsContent value="openai" className="flex-1 mt-4">
              <div className="h-full border rounded-lg">
                <ChatInterface
                  provider="openai"
                  model="gpt-4-turbo-preview"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
