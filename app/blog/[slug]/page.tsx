import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getPostBySlug, getRelatedPosts } from '@/lib/blog/queries'
import { formatPublishedDate } from '@/lib/blog/utils'
import { BlogPostContent } from '@/components/blog/blog-post-content'
import { BlogJsonLd } from '@/components/blog/blog-json-ld'
import { Clock, ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.meta_title || `${post.title} | Lorebound Blog`,
    description: post.meta_description || post.excerpt || '',
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      ...(post.og_image_url && { images: [{ url: post.og_image_url }] }),
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post || post.status !== 'published') {
    notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested join shape
  const categoryIds = (post.blog_post_categories ?? []).map((c: any) => c.category_id)
  const relatedPosts = await getRelatedPosts(post.id, categoryIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested join shape
  const authorName = (post.profiles as any)?.full_name ?? 'Lorebound Team'

  return (
    <>
      <BlogJsonLd
        title={post.title}
        description={post.meta_description || post.excerpt || ''}
        url={`/blog/${post.slug}`}
        published_at={post.published_at ?? post.created_at ?? ''}
        updated_at={post.updated_at ?? post.created_at ?? ''}
        author_name={authorName}
        image_url={post.og_image_url}
      />

      <article className="mx-auto max-w-3xl px-6 py-16">
        {/* Back link */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to blog
        </Link>

        {/* Post header */}
        <header className="mb-10">
          {/* Categories */}
          <div className="mb-4 flex flex-wrap gap-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested join shape */}
            {(post.blog_post_categories ?? []).map((cat: any) => {
              const category = cat.blog_categories
              if (!category) return null
              return (
                <Link
                  key={category.slug}
                  href={`/blog?category=${category.slug}`}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
                >
                  {category.name}
                </Link>
              )
            })}
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{authorName}</span>
            {post.published_at && (
              <time dateTime={post.published_at}>
                {formatPublishedDate(post.published_at)}
              </time>
            )}
            {post.reading_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {post.reading_time_minutes} min read
              </span>
            )}
          </div>
        </header>

        {/* Featured image */}
        {post.featured_image_url && (
          <div className="mb-10 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <BlogPostContent content={post.content} />
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-border/40 bg-muted/20 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-8 font-display text-2xl font-bold tracking-tight">
              Related Posts
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/30"
                >
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {related.title}
                  </h3>
                  {related.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {related.excerpt}
                    </p>
                  )}
                  {related.published_at && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatPublishedDate(related.published_at)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
