'use server'

import { createClient } from '@/lib/supabase/server'
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
        allowed_tools: [], // Will update after creating skills
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
          examples: skill.examples || [],
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
    }

    // 3. Update role with created skill IDs
    if (skillIds.length > 0) {
      const { error: updateError } = await supabase
        .from('roles')
        .update({ allowed_tools: skillIds })
        .eq('id', roleId)

      if (updateError) {
        console.error('Role update error:', updateError)
        // Don't fail - role and skills were created
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
