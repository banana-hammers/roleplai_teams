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
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
        <TabsList className="inline-flex w-max gap-1 md:grid md:w-full md:grid-cols-4">
          <TabsTrigger value="profile" className="min-w-fit px-4">Profile</TabsTrigger>
          <TabsTrigger value="api-keys" className="min-w-fit px-4">API Keys</TabsTrigger>
          <TabsTrigger value="mcp-servers" className="min-w-fit px-4">MCP Servers</TabsTrigger>
          <TabsTrigger value="preferences" className="min-w-fit px-4">Preferences</TabsTrigger>
        </TabsList>
      </div>

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
