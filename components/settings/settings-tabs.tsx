'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSettings } from './profile-settings'
import { ApiKeysSettings } from './api-keys-settings'
import { McpServersSettings } from './mcp-servers-settings'
import { PreferencesSettings } from './preferences-settings'

interface SettingsTabsProps {
  profile: {
    id: string
    email: string
    full_name: string | null
  } | null
  apiKeys: Array<{
    id: string
    provider: string
    label: string | null
    created_at: string
  }>
  mcpServers: Array<{
    id: string
    name: string
    server_type: string
    config: Record<string, unknown>
    is_enabled: boolean | null
  }>
  userEmail: string
}

export function SettingsTabs({ profile, apiKeys, mcpServers, userEmail }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        <TabsTrigger value="mcp-servers">MCP Servers</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileSettings profile={profile} userEmail={userEmail} />
      </TabsContent>

      <TabsContent value="api-keys">
        <ApiKeysSettings apiKeys={apiKeys} />
      </TabsContent>

      <TabsContent value="mcp-servers">
        <McpServersSettings mcpServers={mcpServers} />
      </TabsContent>

      <TabsContent value="preferences">
        <PreferencesSettings />
      </TabsContent>
    </Tabs>
  )
}
