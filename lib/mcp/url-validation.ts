/**
 * MCP URL Validation
 *
 * Validates MCP server URLs for security.
 * Rejects private/internal IPs to prevent SSRF attacks.
 */

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/, // 127.0.0.0/8
  /^10\.\d+\.\d+\.\d+$/, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, // 172.16.0.0/12
  /^192\.168\.\d+\.\d+$/, // 192.168.0.0/16
  /^169\.254\.\d+\.\d+$/, // Link-local
  /^0\.0\.0\.0$/, // All interfaces
  /^\[?::1\]?$/, // IPv6 localhost
  /^\[?fe80:/i, // IPv6 link-local
  /^\[?fc00:/i, // IPv6 unique local
  /^\[?fd/i, // IPv6 unique local
]

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
  const hostname = parsed.hostname
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Private/internal URLs are not allowed' }
    }
  }

  return { valid: true }
}
