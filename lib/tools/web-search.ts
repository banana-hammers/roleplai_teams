/**
 * Web Search Tool
 * Uses Brave Search API or Serper API for web searches
 * Edge-compatible (no Node.js dependencies)
 */

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface WebSearchResult {
  query: string
  results: SearchResult[]
  error?: string
}

/**
 * Execute a web search using available search provider
 */
export async function executeWebSearch(query: string, maxResults: number = 5): Promise<WebSearchResult> {
  // Try Brave Search first, then Serper
  if (process.env.BRAVE_API_KEY) {
    return braveSearch(query, maxResults)
  }

  if (process.env.SERPER_API_KEY) {
    return serperSearch(query, maxResults)
  }

  return {
    query,
    results: [],
    error: 'No search API key configured. Set BRAVE_API_KEY or SERPER_API_KEY.'
  }
}

/**
 * Brave Search API
 * https://brave.com/search/api/
 */
async function braveSearch(query: string, maxResults: number): Promise<WebSearchResult> {
  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': process.env.BRAVE_API_KEY!
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return {
        query,
        results: [],
        error: `Brave Search API error: ${response.status} - ${errorText}`
      }
    }

    const data = await response.json()

    const results: SearchResult[] = (data.web?.results || [])
      .slice(0, maxResults)
      .map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        snippet: r.description || ''
      }))

    return { query, results }
  } catch (error) {
    return {
      query,
      results: [],
      error: `Brave Search error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Serper API (Google Search)
 * https://serper.dev/
 */
async function serperSearch(query: string, maxResults: number): Promise<WebSearchResult> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.SERPER_API_KEY!
      },
      body: JSON.stringify({
        q: query,
        num: maxResults
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        query,
        results: [],
        error: `Serper API error: ${response.status} - ${errorText}`
      }
    }

    const data = await response.json()

    const results: SearchResult[] = (data.organic || [])
      .slice(0, maxResults)
      .map((r: any) => ({
        title: r.title || '',
        url: r.link || '',
        snippet: r.snippet || ''
      }))

    return { query, results }
  } catch (error) {
    return {
      query,
      results: [],
      error: `Serper error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Format search results for Claude
 */
export function formatSearchResults(result: WebSearchResult): string {
  if (result.error) {
    return `Search error: ${result.error}`
  }

  if (result.results.length === 0) {
    return `No results found for "${result.query}"`
  }

  const formatted = result.results
    .map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.snippet}`)
    .join('\n\n')

  return `Search results for "${result.query}":\n\n${formatted}`
}
