/**
 * MCP URL Validation
 *
 * Validates MCP server URLs for security.
 * Rejects private/internal IPs to prevent SSRF attacks.
 */

import { isPrivateHostname } from '@/lib/utils/url-security'

export type UrlValidationResult =
  | { valid: true }
  | { valid: false; error: string }

/**
 * Validate an MCP server URL for security
 *
 * Checks:
 * 1. Valid URL format
 * 2. HTTPS required in production
 * 3. No private/internal IP addresses (SSRF prevention)
 */
export function validateMcpUrl(url: string): UrlValidationResult {
  // Check format
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  // Require HTTPS in production
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'HTTPS is required for MCP servers' }
  }

  // Check for private IPs
  if (isPrivateHostname(parsed.hostname)) {
    return { valid: false, error: 'Private/internal URLs are not allowed' }
  }

  return { valid: true }
}
