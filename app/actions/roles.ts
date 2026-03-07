'use server'

import { requireAuth, verifyRoleOwnership } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import type { CreateRoleData, CreateRoleResult } from '@/types/role-creation'

/**
 * Create a role with associated skills
 */
export async function createRoleWithSkills(data: CreateRoleData): Promise<CreateRoleResult> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  try {
    // Get selected skills
    const selectedSkills = data.selectedSkillIndices.map(i => data.skills[i])

    // 1. Create the role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .insert({
        user_id: user.id,
        name: data.role.name,
        description: data.role.description,
        instructions: data.role.instructions,
        identity_facets: data.role.identity_facets,
        approval_policy: data.role.approval_policy,
        model_preference: 'anthropic/claude-sonnet-4-6', // Default model
      })
      .select('id')
      .single()

    if (roleError || !role) {
      console.error('Role creation error:', roleError)
      return { success: false, error: 'Failed to create role' }
    }

    const roleId = role.id

    // 2. Batch-create skills linked to the role
    let skillIds: string[] = []

    if (selectedSkills.length > 0) {
      const { data: createdSkills, error: skillError } = await supabase
        .from('skills')
        .insert(selectedSkills.map(skill => ({
          user_id: user.id,
          role_id: roleId,
          name: skill.name,
          description: skill.description,
          prompt_template: skill.prompt_template,
          input_schema: skill.input_schema,
          tool_constraints: {},
          version: 1,
        })))
        .select('id')

      if (skillError) {
        console.error('Skill creation error:', skillError)
      }

      if (createdSkills?.length) {
        skillIds = createdSkills.map(s => s.id)

        // Batch-link skills to role via junction table
        await supabase
          .from('role_skills')
          .insert(createdSkills.map(s => ({
            role_id: roleId,
            skill_id: s.id,
          })))
      }
    }

    return {
      success: true,
      roleId,
      skillIds,
    }
  } catch (error) {
    console.error('Role creation error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's roles with resolved skill information
 * Returns roles with skill names/descriptions and context pack counts
 */
export async function getUserRolesWithSkills() {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error, roles: [] }
  const { supabase, user } = auth

  // Fetch identity core voice for display on role cards
  const { data: identityCore } = await supabase
    .from('identity_cores')
    .select('voice')
    .eq('user_id', user.id)
    .maybeSingle()

  const identityVoice = identityCore?.voice || null

  // Single query: fetch roles with nested skills and lore counts
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select(`
      *,
      role_skills(skill_id, skills(id, name, description)),
      role_lore(lore_id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (rolesError || !roles) {
    console.error('Error fetching roles:', rolesError)
    return { success: false, error: 'Failed to fetch roles', roles: [] }
  }

  // Transform nested data to match the existing RoleWithSkills shape
  const enrichedRoles = roles.map((role: any) => {
    const resolved_skills = (role.role_skills || [])
      .map((rs: any) => rs.skills)
      .filter((s: any): s is { id: string; name: string; description: string | null } => s !== undefined && s !== null)

    const { role_skills: _rs, role_lore: roleLore, ...roleData } = role

    return {
      ...roleData,
      resolved_skills,
      lore_count: (roleLore || []).length,
      identity_voice: identityVoice,
    }
  })

  return { success: true, roles: enrichedRoles }
}

/**
 * Get a specific role by ID
 */
export async function getRole(roleId: string) {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error, role: null }
  const { supabase, user } = auth

  const { data: role, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', roleId)
    .eq('user_id', user.id)
    .single()

  if (error || !role) {
    console.error('Error fetching role:', error)
    return { success: false, error: 'Role not found', role: null }
  }

  return { success: true, role }
}

/**
 * Delete a role and all associated data
 * Database CASCADE relationships handle cleanup of:
 * - conversations and messages
 * - role_skills junction entries
 * - role_lore junction entries
 * - mcp_servers
 */
export async function deleteRole(
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', roleId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Role deletion error:', error)
    return { success: false, error: 'Failed to delete role' }
  }

  revalidatePath('/roles')
  return { success: true }
}

/**
 * Get skills for a role
 */
export async function getRoleSkills(roleId: string) {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error, skills: [] }
  const { supabase, user } = auth

  const { data: skills, error } = await supabase
    .from('skills')
    .select('*')
    .eq('role_id', roleId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching skills:', error)
    return { success: false, error: 'Failed to fetch skills', skills: [] }
  }

  return { success: true, skills: skills || [] }
}

/**
 * Create a new skill for a role
 */
export async function createSkill(
  roleId: string,
  skill: {
    name: string
    description: string
    prompt_template: string
    input_schema?: Record<string, unknown>
    // Progressive disclosure fields
    short_description?: string | null
    detailed_instructions?: string | null
    examples?: Array<{ input: string; output: string }>
    linked_lore_ids?: string[]
    allowed_tools?: string[]
    model_preference?: string | null
  }
): Promise<{ success: boolean; skillId?: string; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  // Verify the role belongs to the user
  if (!await verifyRoleOwnership(supabase, roleId, user.id)) {
    return { success: false, error: 'Role not found' }
  }

  try {
    // Create the skill with progressive disclosure fields
    const { data: createdSkill, error: skillError } = await supabase
      .from('skills')
      .insert({
        user_id: user.id,
        role_id: roleId,
        name: skill.name,
        description: skill.description,
        prompt_template: skill.prompt_template,
        input_schema: skill.input_schema?.type ? skill.input_schema : { type: 'object', properties: {}, ...(skill.input_schema || {}) },
        tool_constraints: {},
        version: 1,
        // Progressive disclosure fields
        short_description: skill.short_description || null,
        detailed_instructions: skill.detailed_instructions || null,
        examples: skill.examples || [],
        linked_lore_ids: skill.linked_lore_ids || [],
        allowed_tools: skill.allowed_tools || [],
        model_preference: skill.model_preference || null,
      })
      .select('id')
      .single()

    if (skillError || !createdSkill) {
      console.error('Skill creation error:', skillError)
      return { success: false, error: 'Failed to create skill' }
    }

    // Link skill to role via junction table
    await supabase
      .from('role_skills')
      .insert({
        role_id: roleId,
        skill_id: createdSkill.id,
      })

    return { success: true, skillId: createdSkill.id }
  } catch (error) {
    console.error('Skill creation error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing skill
 */
export async function updateSkill(
  skillId: string,
  updates: {
    name?: string
    description?: string
    prompt_template?: string
    input_schema?: Record<string, unknown>
    // Progressive disclosure fields
    short_description?: string | null
    detailed_instructions?: string | null
    examples?: Array<{ input: string; output: string }>
    linked_lore_ids?: string[]
    allowed_tools?: string[]
    model_preference?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  // Update the skill (RLS ensures user_id match)
  const { error } = await supabase
    .from('skills')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', skillId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Skill update error:', error)
    return { success: false, error: 'Failed to update skill' }
  }

  return { success: true }
}

/**
 * Delete a skill
 */
export async function deleteSkill(
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  // Remove from role_skills junction table first
  await supabase
    .from('role_skills')
    .delete()
    .eq('skill_id', skillId)

  // Delete the skill
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', skillId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Skill deletion error:', error)
    return { success: false, error: 'Failed to delete skill' }
  }

  return { success: true }
}

/**
 * Link a skill to a role
 */
export async function linkSkillToRole(
  roleId: string,
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  // Verify the role belongs to the user
  if (!await verifyRoleOwnership(supabase, roleId, user.id)) {
    return { success: false, error: 'Role not found' }
  }

  // Verify the skill belongs to the user
  const { data: skill, error: skillError } = await supabase
    .from('skills')
    .select('id')
    .eq('id', skillId)
    .eq('user_id', user.id)
    .single()

  if (skillError || !skill) {
    return { success: false, error: 'Skill not found' }
  }

  // Link skill to role via junction table
  const { error: junctionError } = await supabase
    .from('role_skills')
    .upsert({
      role_id: roleId,
      skill_id: skillId,
    }, { onConflict: 'role_id,skill_id' })

  if (junctionError) {
    console.error('Junction table error:', junctionError)
    return { success: false, error: 'Failed to link skill' }
  }

  return { success: true }
}

/**
 * Unlink a skill from a role
 */
export async function unlinkSkillFromRole(
  roleId: string,
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  // Verify the role belongs to the user
  if (!await verifyRoleOwnership(supabase, roleId, user.id)) {
    return { success: false, error: 'Role not found' }
  }

  // Remove from role_skills junction table
  const { error: junctionError } = await supabase
    .from('role_skills')
    .delete()
    .eq('role_id', roleId)
    .eq('skill_id', skillId)

  if (junctionError) {
    console.error('Junction table error:', junctionError)
    return { success: false, error: 'Failed to unlink skill' }
  }

  return { success: true }
}

/**
 * Clone an existing role with all its skills, lore, and MCP servers
 */
export async function cloneRole(
  roleId: string
): Promise<{ success: boolean; roleId?: string; error?: string }> {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  try {
    // Fetch the source role (RLS ensures ownership)
    const { data: sourceRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .eq('user_id', user.id)
      .single()

    if (roleError || !sourceRole) {
      return { success: false, error: 'Role not found' }
    }

    // Create the cloned role
    const { data: newRole, error: insertError } = await supabase
      .from('roles')
      .insert({
        user_id: user.id,
        name: `${sourceRole.name} (Copy)`,
        description: sourceRole.description,
        instructions: sourceRole.instructions,
        identity_facets: sourceRole.identity_facets,
        approval_policy: sourceRole.approval_policy,
        model_preference: sourceRole.model_preference,
      })
      .select('id')
      .single()

    if (insertError || !newRole) {
      console.error('Role clone error:', insertError)
      return { success: false, error: 'Failed to clone role' }
    }

    const newRoleId = newRole.id

    // Copy role_skills junction entries
    const { data: sourceSkills } = await supabase
      .from('role_skills')
      .select('skill_id')
      .eq('role_id', roleId)

    if (sourceSkills?.length) {
      await supabase
        .from('role_skills')
        .insert(sourceSkills.map(rs => ({
          role_id: newRoleId,
          skill_id: rs.skill_id,
        })))
    }

    // Copy role_lore junction entries
    const { data: sourceLore } = await supabase
      .from('role_lore')
      .select('lore_id')
      .eq('role_id', roleId)

    if (sourceLore?.length) {
      await supabase
        .from('role_lore')
        .insert(sourceLore.map(rl => ({
          role_id: newRoleId,
          lore_id: rl.lore_id,
        })))
    }

    // Copy MCP server configurations
    const { data: sourceMcpServers } = await supabase
      .from('mcp_servers')
      .select('name, server_type, config, is_enabled')
      .eq('role_id', roleId)

    if (sourceMcpServers?.length) {
      await supabase
        .from('mcp_servers')
        .insert(sourceMcpServers.map(server => ({
          user_id: user.id,
          role_id: newRoleId,
          name: server.name,
          server_type: server.server_type,
          config: server.config,
          is_enabled: server.is_enabled,
        })))
    }

    revalidatePath('/roles')
    return { success: true, roleId: newRoleId }
  } catch (error) {
    console.error('Role clone error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

