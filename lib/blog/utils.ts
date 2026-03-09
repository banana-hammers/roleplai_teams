/**
 * Calculate reading time from markdown content.
 * Uses 238 words per minute (average adult reading speed).
 */
export function calculateReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 238))
}

/**
 * Format a date for display on blog posts.
 */
export function formatPublishedDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}
