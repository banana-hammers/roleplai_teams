/**
 * Web Fetch Tool
 * Fetches and extracts text content from web pages
 * Edge-compatible (no Node.js dependencies)
 */

export interface WebFetchResult {
  url: string
  title?: string
  content: string
  error?: string
  truncated?: boolean
}

const MAX_CONTENT_LENGTH = 50000 // ~12k tokens

/**
 * Fetch and extract text content from a URL
 */
export async function executeWebFetch(url: string): Promise<WebFetchResult> {
  try {
    // Validate URL
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        url,
        content: '',
        error: 'Only HTTP and HTTPS URLs are supported'
      }
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RoleplayAI/1.0; +https://roleplai.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7'
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      return {
        url,
        content: '',
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const contentType = response.headers.get('content-type') || ''

    // Handle different content types
    if (contentType.includes('application/json')) {
      const json = await response.json()
      const content = JSON.stringify(json, null, 2)
      return truncateContent(url, content)
    }

    if (contentType.includes('text/plain')) {
      const content = await response.text()
      return truncateContent(url, content)
    }

    // Default: HTML
    const html = await response.text()
    const { title, content } = extractTextFromHtml(html)

    return truncateContent(url, content, title)
  } catch (error) {
    return {
      url,
      content: '',
      error: error instanceof Error ? error.message : 'Failed to fetch URL'
    }
  }
}

/**
 * Extract text content from HTML (no external dependencies)
 */
function extractTextFromHtml(html: string): { title?: string; content: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : undefined

  // Remove script and style tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '')

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  text = decodeHtmlEntities(text)

  // Normalize whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()

  return { title, content: text }
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D'
  }

  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char)
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))

  return result
}

/**
 * Truncate content to max length
 */
function truncateContent(url: string, content: string, title?: string): WebFetchResult {
  if (content.length <= MAX_CONTENT_LENGTH) {
    return { url, title, content }
  }

  return {
    url,
    title,
    content: content.slice(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated...]',
    truncated: true
  }
}

/**
 * Format fetch result for Claude
 */
export function formatFetchResult(result: WebFetchResult): string {
  if (result.error) {
    return `Failed to fetch ${result.url}: ${result.error}`
  }

  const parts: string[] = []

  if (result.title) {
    parts.push(`# ${result.title}`)
  }

  parts.push(`URL: ${result.url}`)

  if (result.truncated) {
    parts.push('(Content was truncated due to length)')
  }

  parts.push('')
  parts.push(result.content)

  return parts.join('\n')
}
