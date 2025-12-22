'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Server, Loader2, CheckCircle, XCircle, Plug } from 'lucide-react'
import {
  createMcpServer,
  deleteMcpServer,
  toggleMcpServer,
  testMcpServerConnection,
} from '@/app/actions/mcp'
import type { McpServer, McpServerSSE } from '@/types/mcp'
import { isSseServer } from '@/types/mcp'

interface RoleMcpManagerProps {
  roleId: string
  mcpServers: McpServer[]
  onUpdate?: () => void
}

interface TestResult {
  success: boolean
  tools?: Array<{ name: string; description?: string }>
  serverInfo?: { name: string; version: string }
  error?: string
}

export function RoleMcpManager({ roleId, mcpServers, onUpdate }: RoleMcpManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testingServer, setTestingServer] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  // Form state for creating new server
  const [newServer, setNewServer] = useState({
    name: '',
    url: '',
    headers: '',
  })

  const handleCreateServer = async () => {
    if (!newServer.name.trim() || !newServer.url.trim()) {
      setMessage({ type: 'error', text: 'Please provide a name and URL' })
      return
    }

    // Parse headers if provided
    let headers: Record<string, string> | undefined
    if (newServer.headers.trim()) {
      try {
        headers = JSON.parse(newServer.headers)
      } catch {
        setMessage({ type: 'error', text: 'Invalid headers JSON format' })
        return
      }
    }

    startTransition(async () => {
      const result = await createMcpServer(roleId, {
        name: newServer.name.trim(),
        url: newServer.url.trim(),
        headers,
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'MCP server added successfully' })
        setNewServer({ name: '', url: '', headers: '' })
        setShowCreateForm(false)
        setTestResult(null)
        onUpdate?.()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add server' })
      }
    })
  }

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm('Are you sure you want to remove this MCP server?')) {
      return
    }

    startTransition(async () => {
      const result = await deleteMcpServer(serverId)

      if (result.success) {
        setMessage({ type: 'success', text: 'Server removed successfully' })
        onUpdate?.()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove server' })
      }
    })
  }

  const handleToggleServer = async (serverId: string, enabled: boolean) => {
    startTransition(async () => {
      const result = await toggleMcpServer(serverId, enabled)

      if (result.success) {
        onUpdate?.()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update server' })
      }
    })
  }

  const handleTestConnection = async (url?: string, headers?: string) => {
    const testUrl = url || newServer.url.trim()
    if (!testUrl) {
      setMessage({ type: 'error', text: 'Please provide a URL to test' })
      return
    }

    setTestingServer(url || 'new')
    setTestResult(null)

    // Parse headers
    let parsedHeaders: Record<string, string> | undefined
    const headersStr = headers || newServer.headers.trim()
    if (headersStr) {
      try {
        parsedHeaders = JSON.parse(headersStr)
      } catch {
        setMessage({ type: 'error', text: 'Invalid headers JSON format' })
        setTestingServer(null)
        return
      }
    }

    const result = await testMcpServerConnection(testUrl, parsedHeaders)
    setTestResult(result)
    setTestingServer(null)
  }

  const sseServers = mcpServers.filter(s => isSseServer(s.config))

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`rounded-lg p-3 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
            : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Connected Servers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Connected MCP Servers
          </CardTitle>
          <CardDescription>
            External tool servers that this role can use. Only SSE transport is supported.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sseServers.length > 0 ? (
            <div className="space-y-3">
              {sseServers.map((server) => {
                const config = server.config as McpServerSSE
                return (
                  <div
                    key={server.id}
                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Server className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{server.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {config.url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <Badge variant={server.is_enabled ? 'default' : 'secondary'}>
                        {server.is_enabled ? 'Active' : 'Disabled'}
                      </Badge>
                      <Switch
                        checked={server.is_enabled}
                        onCheckedChange={(checked) => handleToggleServer(server.id, checked)}
                        disabled={isPending}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteServer(server.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No MCP servers connected to this role. Add one to give your RoleplAIr access to external tools.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add New Server */}
      <Card>
        <CardHeader>
          <CardTitle>Add MCP Server</CardTitle>
          <CardDescription>
            Connect to a user-hosted MCP server via SSE transport.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showCreateForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="server-name">Server Name</Label>
                <Input
                  id="server-name"
                  value={newServer.name}
                  onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                  placeholder="e.g., My Database Tools"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="server-url">Server URL</Label>
                <Input
                  id="server-url"
                  value={newServer.url}
                  onChange={(e) => setNewServer({ ...newServer, url: e.target.value })}
                  placeholder="https://your-mcp-server.example.com/mcp"
                />
                <p className="text-xs text-muted-foreground">
                  The MCP server endpoint URL (SSE transport)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="server-headers">Headers (optional)</Label>
                <Textarea
                  id="server-headers"
                  value={newServer.headers}
                  onChange={(e) => setNewServer({ ...newServer, headers: e.target.value })}
                  placeholder='{"Authorization": "Bearer your-token"}'
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  JSON object of custom headers for authentication
                </p>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`rounded-lg p-3 ${
                  testResult.success
                    ? 'bg-green-50 dark:bg-green-950'
                    : 'bg-red-50 dark:bg-red-950'
                }`}>
                  {testResult.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">
                          Connected to {testResult.serverInfo?.name} v{testResult.serverInfo?.version}
                        </span>
                      </div>
                      {testResult.tools && testResult.tools.length > 0 && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          <p className="font-medium">Available tools ({testResult.tools.length}):</p>
                          <ul className="list-disc list-inside mt-1">
                            {testResult.tools.slice(0, 5).map((tool, i) => (
                              <li key={i} className="truncate">
                                {tool.name} {tool.description && `- ${tool.description}`}
                              </li>
                            ))}
                            {testResult.tools.length > 5 && (
                              <li>...and {testResult.tools.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <XCircle className="h-4 w-4" />
                      <span>{testResult.error || 'Connection failed'}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleTestConnection()}
                  disabled={isPending || testingServer !== null}
                >
                  {testingServer === 'new' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button onClick={handleCreateServer} disabled={isPending}>
                  {isPending ? 'Adding...' : 'Add Server'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowCreateForm(false)
                  setNewServer({ name: '', url: '', headers: '' })
                  setTestResult(null)
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add MCP Server
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
