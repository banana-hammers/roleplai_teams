'use server'

import { requireAuth, verifyRoleOwnership } from '@/lib/supabase/auth-helpers'

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
