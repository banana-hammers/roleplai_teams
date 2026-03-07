/**
 * Shared template sanitization utilities for skill execution.
 * Used by both execute-skill.ts and to-anthropic-tools.ts.
 */

/**
 * SECURITY: Maximum length for input values to prevent DoS
 */
export const MAX_INPUT_LENGTH = 100000

/**
 * SECURITY: Validate that a key is a safe placeholder name
 */
export function isValidPlaceholderKey(key: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
}

/**
 * SECURITY: Sanitize input value for template interpolation
 */
export function sanitizeTemplateInput(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  let str = String(value)

  if (str.length > MAX_INPUT_LENGTH) {
    str = str.slice(0, MAX_INPUT_LENGTH) + '... [truncated]'
  }

  return str
}
