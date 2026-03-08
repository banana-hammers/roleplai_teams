// Barrel file — re-exports all role actions so existing imports continue to work
export {
  createRoleWithSkills,
  getUserRolesWithSkills,
  getRole,
  deleteRole,
  cloneRole,
} from './crud'

export {
  getRoleSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  linkSkillToRole,
  unlinkSkillFromRole,
} from './skills'
