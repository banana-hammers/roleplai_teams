'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const MODELS = [
  { value: 'anthropic/claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { value: 'anthropic/claude-opus-4-20250514', label: 'Claude Opus 4', provider: 'Anthropic' },
  { value: 'openai/gpt-4-turbo-preview', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'openai/gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
]

export function PreferencesSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Set your default preferences for new roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Default Model</Label>
          <Select defaultValue="anthropic/claude-sonnet-4-5-20250929">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center gap-2">
                    <span>{model.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {model.provider}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This model will be used by default when creating new roles.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Default Approval Policy</Label>
          <Select defaultValue="smart">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">
                <div>
                  <span className="font-medium">Always Ask</span>
                  <p className="text-xs text-muted-foreground">
                    Require approval for all tool uses
                  </p>
                </div>
              </SelectItem>
              <SelectItem value="smart">
                <div>
                  <span className="font-medium">Smart</span>
                  <p className="text-xs text-muted-foreground">
                    Auto-approve safe operations, ask for risky ones
                  </p>
                </div>
              </SelectItem>
              <SelectItem value="never">
                <div>
                  <span className="font-medium">Never Ask</span>
                  <p className="text-xs text-muted-foreground">
                    Auto-approve all tool uses
                  </p>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">
          These preferences apply to newly created roles. Existing roles keep their current settings.
        </p>
      </CardContent>
    </Card>
  )
}
