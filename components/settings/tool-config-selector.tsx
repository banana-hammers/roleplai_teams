'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  BUILT_IN_TOOLS,
  WEB_TOOLS,
  getToolDescription,
} from '@/lib/agent/tool-permissions'
import {
  FileText,
  FilePlus,
  FileEdit,
  Terminal,
  Search,
  FolderSearch,
  Users,
  Globe,
  Download,
  ListTodo,
} from 'lucide-react'

interface ToolConfigSelectorProps {
  toolConfig: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  onSave: () => void
  saving: boolean
}

const TOOL_ICONS: Record<string, React.ReactNode> = {
  Read: <FileText className="h-4 w-4" />,
  Write: <FilePlus className="h-4 w-4" />,
  Edit: <FileEdit className="h-4 w-4" />,
  Bash: <Terminal className="h-4 w-4" />,
  Glob: <FolderSearch className="h-4 w-4" />,
  Grep: <Search className="h-4 w-4" />,
  Task: <Users className="h-4 w-4" />,
  WebSearch: <Globe className="h-4 w-4" />,
  WebFetch: <Download className="h-4 w-4" />,
  TodoWrite: <ListTodo className="h-4 w-4" />,
}

const RISK_LEVELS: Record<string, 'safe' | 'moderate' | 'dangerous'> = {
  Read: 'safe',
  Glob: 'safe',
  Grep: 'safe',
  Write: 'moderate',
  Edit: 'moderate',
  WebSearch: 'moderate',
  WebFetch: 'moderate',
  Bash: 'dangerous',
  Task: 'moderate',
  TodoWrite: 'safe',
}

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
  const builtInTools = (toolConfig.builtInTools as string[]) || ['Read', 'Glob', 'Grep']
  const webTools = (toolConfig.webTools as string[]) || []

  const toggleBuiltInTool = (tool: string) => {
    const current = new Set(builtInTools)
    if (current.has(tool)) {
      current.delete(tool)
    } else {
      current.add(tool)
    }
    onChange({
      ...toolConfig,
      builtInTools: Array.from(current),
    })
  }

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
          <CardTitle>Built-in Tools</CardTitle>
          <CardDescription>
            Core tools for file operations and command execution.
            Safe tools are enabled by default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {BUILT_IN_TOOLS.map((tool) => {
            const isEnabled = builtInTools.includes(tool)
            const risk = RISK_LEVELS[tool]

            return (
              <div
                key={tool}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    {TOOL_ICONS[tool]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tool}</p>
                      <Badge variant="outline" className={RISK_COLORS[risk]}>
                        {risk}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getToolDescription(tool)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`tool-${tool}`} className="sr-only">
                    Enable {tool}
                  </Label>
                  <Switch
                    id={`tool-${tool}`}
                    checked={isEnabled}
                    onCheckedChange={() => toggleBuiltInTool(tool)}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Web Tools</CardTitle>
          <CardDescription>
            Tools for accessing external web resources.
            Disabled by default for security.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {WEB_TOOLS.map((tool) => {
            const isEnabled = webTools.includes(tool)
            const risk = RISK_LEVELS[tool]

            return (
              <div
                key={tool}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    {TOOL_ICONS[tool]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tool}</p>
                      <Badge variant="outline" className={RISK_COLORS[risk]}>
                        {risk}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getToolDescription(tool)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`tool-${tool}`} className="sr-only">
                    Enable {tool}
                  </Label>
                  <Switch
                    id={`tool-${tool}`}
                    checked={isEnabled}
                    onCheckedChange={() => toggleWebTool(tool)}
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
