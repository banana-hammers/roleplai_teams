/**
 * Shared URL Security Utilities
 *
 * SSRF protection for web-facing tools and MCP server connections.
 * Blocks private/internal IP addresses to prevent server-side request forgery.
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

/**
 * Check if a hostname resolves to a private/internal IP address.
 * Used to prevent SSRF attacks.
 */
export function isPrivateHostname(hostname: string): boolean {
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return true
    }
  }
  return false
}
