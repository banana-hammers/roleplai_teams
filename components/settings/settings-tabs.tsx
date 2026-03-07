'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileSettings } from './profile-settings'
import { ApiKeysSettings } from './api-keys-settings'
import { McpServersSettings } from './mcp-servers-settings'
import { PreferencesSettings } from './preferences-settings'
import { IdentitySettings } from './identity-settings'
import type { IdentityCore } from '@/types/identity'

interface SettingsTabsProps {
  identityCore: IdentityCore | null
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

export function SettingsTabs({ identityCore, profile, apiKeys, mcpServers, userEmail }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
        <TabsList className="inline-flex w-max gap-1 md:grid md:w-full md:grid-cols-5">
          <TabsTrigger value="identity" className="min-w-0 px-3 truncate">Identity</TabsTrigger>
          <TabsTrigger value="profile" className="min-w-0 px-3 truncate">Profile</TabsTrigger>
          <TabsTrigger value="api-keys" className="min-w-0 px-3 truncate">API Keys</TabsTrigger>
          <TabsTrigger value="mcp-servers" className="min-w-0 px-3 truncate">MCP</TabsTrigger>
          <TabsTrigger value="preferences" className="min-w-0 px-3 truncate">Preferences</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="identity">
        <IdentitySettings identityCore={identityCore} />
      </TabsContent>

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
