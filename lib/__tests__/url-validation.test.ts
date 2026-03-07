import { describe, it, expect } from 'vitest'
import { validateMcpUrl } from '@/lib/mcp/url-validation'

describe('validateMcpUrl', () => {
  it('accepts valid HTTPS URLs', () => {
    const result = validateMcpUrl('https://mcp.example.com/sse')
    expect(result.valid).toBe(true)
  })

  it('accepts HTTP in non-production', () => {
    const result = validateMcpUrl('http://mcp.example.com/sse')
    expect(result.valid).toBe(true)
  })

  it('rejects invalid URLs', () => {
    const result = validateMcpUrl('not a url')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Invalid URL')
    }
  })

  it('rejects private IPs', () => {
    const result = validateMcpUrl('http://192.168.1.1/sse')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Private')
    }
  })

  it('rejects localhost', () => {
    const result = validateMcpUrl('http://localhost:3000/sse')
    expect(result.valid).toBe(false)
  })

  it('rejects 127.0.0.1', () => {
    const result = validateMcpUrl('http://127.0.0.1:8080/sse')
    expect(result.valid).toBe(false)
  })
})
