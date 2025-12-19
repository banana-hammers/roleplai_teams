'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Database, Globe, Terminal, Server, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BUILT_IN_MCP_SERVERS, getMcpServerDescription } from '@/types/mcp'

interface McpServersSettingsProps {
  mcpServers: Array<{
    id: string
    name: string
    server_type: string
    config: Record<string, unknown>
    is_enabled: boolean | null
  }>
}

const SERVER_ICONS: Record<string, React.ReactNode> = {
  playwright: <Globe className="h-4 w-4" />,
  filesystem: <Terminal className="h-4 w-4" />,
  github: <Server className="h-4 w-4" />,
  postgres: <Database className="h-4 w-4" />,
  fetch: <Globe className="h-4 w-4" />,
  memory: <Database className="h-4 w-4" />,
}

export function McpServersSettings({ mcpServers: initialServers }: McpServersSettingsProps) {
  const [servers, setServers] = useState(initialServers)
  const [enabling, setEnabling] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const builtInServerNames = Object.keys(BUILT_IN_MCP_SERVERS)
  const enabledBuiltIn = servers.filter(s => builtInServerNames.includes(s.name))
  const enabledBuiltInNames = new Set(enabledBuiltIn.map(s => s.name))

  const handleToggleBuiltIn = async (serverName: string, currentlyEnabled: boolean) => {
    setEnabling(serverName)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      if (currentlyEnabled) {
        // Disable: delete the record
        const { error } = await supabase
          .from('mcp_servers')
          .delete()
          .eq('user_id', user.id)
          .eq('name', serverName)
          .is('role_id', null)

        if (error) throw error

        setServers(servers.filter(s => s.name !== serverName))
      } else {
        // Enable: insert the record
        const config = BUILT_IN_MCP_SERVERS[serverName]
        const { data, error } = await supabase
          .from('mcp_servers')
          .insert({
            user_id: user.id,
            name: serverName,
            server_type: config.type || 'stdio',
            config,
            is_enabled: true,
          })
          .select()
          .single()

        if (error) throw error

        setServers([...servers, data])
      }

      setMessage({
        type: 'success',
        text: `${serverName} ${currentlyEnabled ? 'disabled' : 'enabled'}`
      })
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to toggle ${serverName}` })
    } finally {
      setEnabling(null)
    }
  }

  const handleDeleteCustom = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('mcp_servers')
        .delete()
        .eq('id', id)

      if (error) throw error

      setServers(servers.filter(s => s.id !== id))
      setMessage({ type: 'success', text: 'Server deleted' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete server' })
    }
  }

  const customServers = servers.filter(s => !builtInServerNames.includes(s.name))

  return (
    <Card>
      <CardHeader>
        <CardTitle>MCP Servers</CardTitle>
        <CardDescription>
          Enable Model Context Protocol servers to give your roles access to external tools and systems.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Built-in servers */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Built-in Servers</h3>
          <div className="space-y-3">
            {builtInServerNames.map((name) => {
              const isEnabled = enabledBuiltInNames.has(name)
              const isLoading = enabling === name

              return (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      {SERVER_ICONS[name] || <Server className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getMcpServerDescription(name)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`toggle-${name}`} className="sr-only">
                      Enable {name}
                    </Label>
                    <Switch
                      id={`toggle-${name}`}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggleBuiltIn(name, isEnabled)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Custom servers */}
        {customServers.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Custom Servers</h3>
            <div className="space-y-3">
              {customServers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Server className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{server.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {server.server_type}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCustom(server.id, server.name)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Enabled servers will be available to all your roles by default.
          You can override this per-role in role settings.
        </p>
      </CardContent>
    </Card>
  )
}
