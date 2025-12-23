/**
 * Formats web search results from Anthropic's WebSearchToolResultBlock
 * for display in the UI
 */

interface WebSearchResult {
  type: 'web_search_result'
  title: string
  url: string
  encrypted_content?: string
  page_age?: string
}

interface WebSearchError {
  type: 'web_search_error'
  error_code: string
}

type WebSearchContent = WebSearchResult | WebSearchError

export function formatWebSearchResults(content: unknown): string {
  if (!content || !Array.isArray(content)) {
    return 'No search results'
  }

  const results: string[] = []

  for (const item of content as WebSearchContent[]) {
    if (item.type === 'web_search_error') {
      results.push(`Search error: ${item.error_code}`)
    } else if (item.type === 'web_search_result') {
      const ageInfo = item.page_age ? ` (${item.page_age})` : ''
      results.push(`${item.title}${ageInfo}\n${item.url}`)
    }
  }

  if (results.length === 0) {
    return 'No search results found'
  }

  return results.join('\n\n')
}
