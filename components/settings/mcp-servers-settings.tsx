'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Server, Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface McpServersSettingsProps {
  mcpServers: Array<{
    id: string
    name: string
    server_type: string
    config: Record<string, unknown>
    is_enabled: boolean | null
  }>
}

export function McpServersSettings({ mcpServers: initialServers }: McpServersSettingsProps) {
  const [servers, setServers] = useState(initialServers)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleDeleteServer = async (id: string, name: string) => {
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
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete server' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>MCP Servers</CardTitle>
        <CardDescription>
          Connect to MCP (Model Context Protocol) servers to give your roles access to external tools.
          This app supports SSE transport only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected servers */}
        {servers.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Connected Servers</h3>
            <div className="space-y-3">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
                      <Server className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{server.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {server.server_type}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteServer(server.id, server.name)}
                    className="self-end sm:self-auto"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No MCP servers connected. Add servers per-role in role settings, or host your own SSE MCP server.
          </p>
        )}

        {message && (
          <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        {/* Documentation links */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <h4 className="text-sm font-medium">Learn More</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              MCP servers provide tools that your AI roles can use. This app connects to servers via SSE (Server-Sent Events) transport.
            </p>
            <div className="flex flex-col gap-1">
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                MCP Specification
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://github.com/modelcontextprotocol/servers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Community MCP Servers
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs">
              Note: Most MCP servers use stdio transport. To use them here, you&apos;ll need to wrap them in an SSE endpoint or use a hosted service.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
