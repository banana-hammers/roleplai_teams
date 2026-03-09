interface BlogJsonLdProps {
  title: string
  description: string
  url: string
  published_at: string
  updated_at: string
  author_name: string
  image_url?: string | null
}

export function BlogJsonLd({
  title,
  description,
  url,
  published_at,
  updated_at,
  author_name,
  image_url,
}: BlogJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished: published_at,
    dateModified: updated_at,
    author: {
      '@type': 'Person',
      name: author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'RoleplAI Teams',
    },
    ...(image_url && { image: image_url }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
