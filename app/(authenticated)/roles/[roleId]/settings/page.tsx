import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { RoleSettingsForm } from '@/components/settings/role-settings-form'
import type { McpServer } from '@/types/mcp'

interface RoleSettingsPageProps {
  params: Promise<{ roleId: string }>
}

export default async function RoleSettingsPage({ params }: RoleSettingsPageProps) {
  const { roleId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the role
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .eq('user_id', user.id)
    .single()

  if (roleError || !role) {
    notFound()
  }

  // Fetch role skills
  const { data: roleSkillsData } = await supabase
    .from('role_skills')
    .select(`
      skill_id,
      config_overrides,
      skills (id, name, description)
    `)
    .eq('role_id', roleId)

  // Transform roleSkills to match expected type (Supabase returns nested objects)
  const roleSkills = (roleSkillsData || []).map((rs: any) => ({
    skill_id: rs.skill_id,
    config_overrides: rs.config_overrides,
    skills: rs.skills as { id: string; name: string; description: string } | null,
  }))

  // Fetch all available skills
  const { data: allSkills } = await supabase
    .from('skills')
    .select('id, name, description, input_schema')
    .order('name')

  // Fetch MCP servers for this role
  const { data: mcpServersData } = await supabase
    .from('mcp_servers')
    .select('*')
    .eq('role_id', roleId)
    .eq('user_id', user.id)
    .order('name')

  const mcpServers = (mcpServersData || []) as McpServer[]

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl px-4 py-8">
        <div className="mb-6">
          <a
            href={`/roles/${roleId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to {role.name}
          </a>
          <h1 className="mt-2 text-2xl font-semibold">{role.name} Settings</h1>
        </div>

        <RoleSettingsForm
          role={role}
          roleSkills={roleSkills || []}
          allSkills={allSkills || []}
          mcpServers={mcpServers}
        />
      </main>
    </div>
  )
}
