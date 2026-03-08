import { describe, it, expect } from 'vitest'
import {
  convertPrioritiesToNaturalLanguage,
  convertBoundariesToNaturalLanguage,
  buildRoleSystemPrompt,
} from '@/lib/prompts/system-prompt-builder'
import type { Role } from '@/types/role'

describe('convertPrioritiesToNaturalLanguage', () => {
  it('returns empty string for undefined', () => {
    expect(convertPrioritiesToNaturalLanguage(undefined)).toBe('')
  })

  it('returns empty string for empty array', () => {
    expect(convertPrioritiesToNaturalLanguage([])).toBe('')
  })

  it('generates ranked priorities', () => {
    const result = convertPrioritiesToNaturalLanguage(['accuracy', 'creativity', 'efficiency'])
    expect(result).toContain('PRIMARY')
    expect(result).toContain('SECONDARY')
    expect(result).toContain('TERTIARY')
    expect(result).toContain('Getting things right')
  })

  it('handles unknown priority keys gracefully', () => {
    const result = convertPrioritiesToNaturalLanguage(['accuracy', 'unknown_key'])
    expect(result).toContain('PRIMARY')
    expect(result).not.toContain('SECONDARY') // unknown key skipped
  })
})

describe('convertBoundariesToNaturalLanguage', () => {
  it('returns empty string for undefined', () => {
    expect(convertBoundariesToNaturalLanguage(undefined)).toBe('')
  })

  it('converts enabled boundaries', () => {
    const result = convertBoundariesToNaturalLanguage({
      no_speculation: true,
      admit_uncertainty: true,
      respect_privacy: false,
    })
    expect(result).toContain('don\'t speculate')
    expect(result).toContain('uncertain')
    expect(result).not.toContain('privacy') // disabled
  })

  it('includes custom boundaries', () => {
    const result = convertBoundariesToNaturalLanguage({
      custom: ['Always be kind', 'Never use sarcasm'],
    })
    expect(result).toContain('Always be kind')
    expect(result).toContain('Never use sarcasm')
  })
})

describe('buildRoleSystemPrompt', () => {
  const minimalRole: Role = {
    id: 'test-id',
    user_id: 'user-id',
    name: 'Test Bot',
    description: 'A test role',
    instructions: 'Be helpful.',
    model_preference: 'anthropic/claude-haiku-4-5',
    approval_policy: 'smart',
    identity_facets: {},
    created_at: '',
    updated_at: '',
  }

  it('includes role name and description', () => {
    const prompt = buildRoleSystemPrompt({ role: minimalRole })
    expect(prompt).toContain('Test Bot')
    expect(prompt).toContain('A test role')
  })

  it('includes instructions', () => {
    const prompt = buildRoleSystemPrompt({ role: minimalRole })
    expect(prompt).toContain('Be helpful.')
  })

  it('includes skills when provided', () => {
    const prompt = buildRoleSystemPrompt({
      role: minimalRole,
      skills: [{ id: 's1', name: 'Summarize', description: 'Summarizes text', short_description: 'Summarize text' }],
    })
    expect(prompt).toContain('Summarize')
    expect(prompt).toContain('available_skills')
  })

  it('includes lore when provided', () => {
    const prompt = buildRoleSystemPrompt({
      role: minimalRole,
      lore: [{
        id: 'l1',
        user_id: 'user-id',
        name: 'Brand Guide',
        content: 'Always use blue.',
        type: 'brand',
        created_at: '',
        updated_at: '',
      }],
    })
    expect(prompt).toContain('Brand Guide')
    expect(prompt).toContain('Always use blue.')
  })

  it('includes past conversations when provided', () => {
    const prompt = buildRoleSystemPrompt({
      role: minimalRole,
      pastConversations: [{ title: 'Chat 1', summary: 'Discussed testing', date: 'Mar 7' }],
    })
    expect(prompt).toContain('past_conversations')
    expect(prompt).toContain('Discussed testing')
  })

  it('omits optional sections when not provided', () => {
    const prompt = buildRoleSystemPrompt({ role: minimalRole })
    expect(prompt).not.toContain('<available_skills>')
    expect(prompt).not.toContain('<knowledge>')
    expect(prompt).not.toContain('<past_conversations>')
  })
})
