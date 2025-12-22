import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsTabs } from '@/components/settings/settings-tabs'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user API keys (without decrypting)
  const { data: apiKeys } = await supabase
    .from('user_api_keys')
    .select('id, provider, label, created_at')
    .eq('user_id', user.id)

  // Fetch user-level MCP servers
  const { data: mcpServers } = await supabase
    .from('mcp_servers')
    .select('*')
    .eq('user_id', user.id)
    .is('role_id', null)
    .order('name')

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
        <SettingsTabs
          profile={profile}
          apiKeys={apiKeys || []}
          mcpServers={mcpServers || []}
          userEmail={user.email || ''}
        />
      </main>
    </div>
  )
}
