'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Globe, Download } from 'lucide-react'

interface ToolConfigSelectorProps {
  toolConfig: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  onSave: () => void
  saving: boolean
}

const WEB_TOOLS = [
  {
    name: 'web_search',
    displayName: 'Web Search',
    description: 'Search the web for information using Brave or Serper API',
    icon: <Globe className="h-4 w-4" />,
    risk: 'moderate' as const,
  },
  {
    name: 'web_fetch',
    displayName: 'Web Fetch',
    description: 'Fetch and read content from web pages',
    icon: <Download className="h-4 w-4" />,
    risk: 'moderate' as const,
  },
]

const RISK_COLORS = {
  safe: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  dangerous: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export function ToolConfigSelector({
  toolConfig,
  onChange,
  onSave,
  saving,
}: ToolConfigSelectorProps) {
  const webTools = (toolConfig.webTools as string[]) || []

  const toggleWebTool = (tool: string) => {
    const current = new Set(webTools)
    if (current.has(tool)) {
      current.delete(tool)
    } else {
      current.add(tool)
    }
    onChange({
      ...toolConfig,
      webTools: Array.from(current),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Web Tools</CardTitle>
          <CardDescription>
            Enable web tools to allow your role to search the internet and fetch web pages.
            These tools require API keys to be configured in your environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {WEB_TOOLS.map((tool) => {
            const isEnabled = webTools.includes(tool.name)

            return (
              <div
                key={tool.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    {tool.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tool.displayName}</p>
                      <Badge variant="outline" className={RISK_COLORS[tool.risk]}>
                        {tool.risk}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`tool-${tool.name}`} className="sr-only">
                    Enable {tool.displayName}
                  </Label>
                  <Switch
                    id={`tool-${tool.name}`}
                    checked={isEnabled}
                    onCheckedChange={() => toggleWebTool(tool.name)}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Tool Configuration'}
        </Button>
      </div>
    </div>
  )
}
