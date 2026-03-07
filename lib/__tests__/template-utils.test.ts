import { describe, it, expect } from 'vitest'
import {
  isValidPlaceholderKey,
  sanitizeTemplateInput,
  MAX_INPUT_LENGTH,
} from '@/lib/skills/template-utils'

describe('isValidPlaceholderKey', () => {
  it('accepts valid keys', () => {
    expect(isValidPlaceholderKey('topic')).toBe(true)
    expect(isValidPlaceholderKey('user_input')).toBe(true)
    expect(isValidPlaceholderKey('_private')).toBe(true)
    expect(isValidPlaceholderKey('camelCase')).toBe(true)
    expect(isValidPlaceholderKey('key123')).toBe(true)
  })

  it('rejects invalid keys', () => {
    expect(isValidPlaceholderKey('123start')).toBe(false)
    expect(isValidPlaceholderKey('has spaces')).toBe(false)
    expect(isValidPlaceholderKey('has-dashes')).toBe(false)
    expect(isValidPlaceholderKey('')).toBe(false)
    expect(isValidPlaceholderKey('a.b')).toBe(false)
  })
})

describe('sanitizeTemplateInput', () => {
  it('converts values to strings', () => {
    expect(sanitizeTemplateInput('hello')).toBe('hello')
    expect(sanitizeTemplateInput(42)).toBe('42')
    expect(sanitizeTemplateInput(true)).toBe('true')
  })

  it('handles null and undefined', () => {
    expect(sanitizeTemplateInput(null)).toBe('')
    expect(sanitizeTemplateInput(undefined)).toBe('')
  })

  it('truncates long inputs', () => {
    const longInput = 'a'.repeat(MAX_INPUT_LENGTH + 100)
    const result = sanitizeTemplateInput(longInput)
    expect(result.length).toBeLessThan(longInput.length)
    expect(result).toContain('[truncated]')
  })

  it('does not truncate inputs at the limit', () => {
    const exactInput = 'a'.repeat(MAX_INPUT_LENGTH)
    const result = sanitizeTemplateInput(exactInput)
    expect(result).toBe(exactInput)
  })
})
