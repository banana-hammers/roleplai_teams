'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateRoleData, CreateRoleResult, ExtractedRoleConfig, ExtractedSkill } from '@/types/role-creation'

/**
 * Create a role with associated skills
 */
export async function createRoleWithSkills(data: CreateRoleData): Promise<CreateRoleResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

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
        model_preference: 'anthropic/claude-sonnet-4-5-20250929', // Default model
      })
      .select('id')
      .single()

    if (roleError || !role) {
      console.error('Role creation error:', roleError)
      return { success: false, error: 'Failed to create role' }
    }

    const roleId = role.id

    // 2. Create skills linked to the role
    const skillIds: string[] = []

    for (const skill of selectedSkills) {
      const { data: createdSkill, error: skillError } = await supabase
        .from('skills')
        .insert({
          user_id: user.id,
          role_id: roleId,
          name: skill.name,
          description: skill.description,
          prompt_template: skill.prompt_template,
          input_schema: skill.input_schema,
          tool_constraints: {},
          version: 1,
        })
        .select('id')
        .single()

      if (skillError || !createdSkill) {
        console.error('Skill creation error:', skillError)
        // Continue creating other skills, but log the error
        continue
      }

      skillIds.push(createdSkill.id)

      // Link skill to role via junction table
      await supabase
        .from('role_skills')
        .insert({
          role_id: roleId,
          skill_id: createdSkill.id,
        })
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
 * Get user's roles
 */
export async function getUserRoles() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated', roles: [] }
  }

  const { data: roles, error } = await supabase
    .from('roles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching roles:', error)
    return { success: false, error: 'Failed to fetch roles', roles: [] }
  }

  return { success: true, roles: roles || [] }
}

/**
 * Get user's roles with resolved skill information
 * Returns roles with skill names/descriptions and context pack counts
 */
export async function getUserRolesWithSkills() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated', roles: [] }
  }

  // 1. Fetch all roles
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (rolesError || !roles) {
    console.error('Error fetching roles:', rolesError)
    return { success: false, error: 'Failed to fetch roles', roles: [] }
  }

  // 2. Fetch all skills linked to roles via junction table
  const roleIds = roles.map(r => r.id)

  const { data: roleSkillLinks } = await supabase
    .from('role_skills')
    .select('role_id, skill_id')
    .in('role_id', roleIds)

  // Build a map of skill IDs per role
  const roleSkillMap = new Map<string, string[]>()
  if (roleSkillLinks) {
    for (const link of roleSkillLinks) {
      const skillIds = roleSkillMap.get(link.role_id) || []
      skillIds.push(link.skill_id)
      roleSkillMap.set(link.role_id, skillIds)
    }
  }

  // 3. Fetch all unique skills
  const allSkillIds = new Set<string>()
  for (const skillIds of roleSkillMap.values()) {
    skillIds.forEach(id => allSkillIds.add(id))
  }

  const skillsMap = new Map<string, { id: string; name: string; description: string | null }>()
  if (allSkillIds.size > 0) {
    const { data: skills } = await supabase
      .from('skills')
      .select('id, name, description')
      .in('id', Array.from(allSkillIds))

    if (skills) {
      for (const skill of skills) {
        skillsMap.set(skill.id, skill)
      }
    }
  }

  // 4. Fetch lore counts for all roles
  const { data: loreLinks } = await supabase
    .from('role_lore')
    .select('role_id')
    .in('role_id', roleIds)

  // Count lore per role
  const loreCounts = new Map<string, number>()
  if (loreLinks) {
    for (const link of loreLinks) {
      const count = loreCounts.get(link.role_id) || 0
      loreCounts.set(link.role_id, count + 1)
    }
  }

  // 5. Enrich roles with resolved skills and counts
  const enrichedRoles = roles.map(role => {
    // Get skills linked to this role via junction table
    const roleSkillIds = roleSkillMap.get(role.id) || []
    const resolved_skills = roleSkillIds
      .map(skillId => skillsMap.get(skillId))
      .filter((skill): skill is { id: string; name: string; description: string | null } => skill !== undefined)

    return {
      ...role,
      resolved_skills,
      lore_count: loreCounts.get(role.id) || 0,
    }
  })

  return { success: true, roles: enrichedRoles }
}

/**
 * Get a specific role by ID
 */
export async function getRole(roleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated', role: null }
  }

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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated', skills: [] }
  }

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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify the role belongs to the user
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('id', roleId)
    .eq('user_id', user.id)
    .single()

  if (roleError || !role) {
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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify the role belongs to the user
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('id', roleId)
    .eq('user_id', user.id)
    .single()

  if (roleError || !role) {
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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify the role belongs to the user
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('id', roleId)
    .eq('user_id', user.id)
    .single()

  if (roleError || !role) {
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
 * Get all skills for the current user (for adding to roles)
 */
export async function getAllUserSkills() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated', skills: [] }
  }

  const { data: skills, error } = await supabase
    .from('skills')
    .select('id, name, description, role_id')
    .eq('user_id', user.id)
    .order('name')

  if (error) {
    console.error('Error fetching skills:', error)
    return { success: false, error: 'Failed to fetch skills', skills: [] }
  }

  return { success: true, skills: skills || [] }
}
