'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { StatusMessage } from './status-message'
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
  const [deletingServerId, setDeletingServerId] = useState<string | null>(null)

  const handleDeleteServer = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('mcp_servers')
        .delete()
        .eq('id', id)

      if (error) throw error

      setServers(servers.filter(s => s.id !== id))
      setDeletingServerId(null)
      setMessage({ type: 'success', text: 'Server deleted' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete server' })
      setDeletingServerId(null)
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
                  <AlertDialog open={deletingServerId === server.id} onOpenChange={(open) => !open && setDeletingServerId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingServerId(server.id)}
                        className="self-end sm:self-auto"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{server.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this MCP server connection. Any roles using it will lose access to its tools.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteServer(server.id)} className="bg-destructive text-white hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
            <Server className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">No MCP servers connected</p>
              <p className="text-sm text-muted-foreground">
                MCP servers are managed per-role. Go to a role&apos;s settings to add servers.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/roles">Go to Roles</a>
            </Button>
          </div>
        )}

        <StatusMessage message={message} />

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
