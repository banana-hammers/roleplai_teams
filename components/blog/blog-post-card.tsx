import Link from 'next/link'
import { formatPublishedDate } from '@/lib/blog/utils'
import { Clock } from 'lucide-react'

interface BlogPostCardProps {
  title: string
  slug: string
  excerpt: string | null
  published_at: string | null
  reading_time_minutes: number | null
  featured_image_url: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested join shape
  categories: any[]
}

export function BlogPostCard({
  title,
  slug,
  excerpt,
  published_at,
  reading_time_minutes,
  featured_image_url,
  categories,
}: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/30 hover:bg-card/80"
    >
      {featured_image_url && (
        <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featured_image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((cat: { blog_categories: { slug: string; name: string } | null }) => {
            const category = cat.blog_categories
            if (!category) return null
            return (
              <span
                key={category.slug}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {category.name}
              </span>
            )
          })}
        </div>
      )}

      <h2 className="font-display text-xl font-semibold tracking-tight group-hover:text-primary">
        {title}
      </h2>

      {excerpt && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {excerpt}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        {published_at && (
          <time dateTime={published_at}>
            {formatPublishedDate(published_at)}
          </time>
        )}
        {reading_time_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {reading_time_minutes} min read
          </span>
        )}
      </div>
    </Link>
  )
}
