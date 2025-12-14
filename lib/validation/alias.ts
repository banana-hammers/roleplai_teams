/**
 * Alias validation utilities
 */

export interface AliasValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates alias format (3-20 chars, alphanumeric + underscores)
 */
export function validateAliasFormat(alias: string): AliasValidationResult {
  if (!alias || alias.length === 0) {
    return { isValid: false, error: 'Alias is required' }
  }

  if (alias.length < 3) {
    return { isValid: false, error: 'Alias must be at least 3 characters' }
  }

  if (alias.length > 20) {
    return { isValid: false, error: 'Alias must be 20 characters or less' }
  }

  const validPattern = /^[a-zA-Z0-9_]+$/
  if (!validPattern.test(alias)) {
    return { isValid: false, error: 'Alias can only contain letters, numbers, and underscores' }
  }

  return { isValid: true }
}

/**
 * Generate alias suggestions based on a taken alias
 */
export function generateAliasSuggestions(baseAlias: string): string[] {
  const suggestions: string[] = []

  suggestions.push(`${baseAlias}_ai`)
  suggestions.push(`${baseAlias}_dev`)
  suggestions.push(`${baseAlias}_pro`)
  suggestions.push(`${baseAlias}_${Math.floor(Math.random() * 99) + 1}`)

  return suggestions.slice(0, 3) // Return top 3
}
