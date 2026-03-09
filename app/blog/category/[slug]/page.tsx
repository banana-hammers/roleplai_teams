import type { Metadata } from 'next'
import { getPublishedPosts, getCategories } from '@/lib/blog/queries'
import { BlogHeader } from '@/components/blog/blog-header'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const categories = await getCategories()
  const category = categories.find(c => c.slug === slug)

  if (!category) return { title: 'Category Not Found' }

  return {
    title: `${category.name} | Lorebound Blog`,
    description: category.description || `Posts about ${category.name} from the Lorebound blog.`,
  }
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params
  const [posts, categories] = await Promise.all([
    getPublishedPosts(slug),
    getCategories(),
  ])

  const category = categories.find(c => c.slug === slug)

  return (
    <>
      <BlogHeader
        title={category?.name ?? 'Category'}
        description={category?.description ?? ''}
      />

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All posts
        </Link>

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase nested join shape */}
            {posts.map((post: any) => (
              <BlogPostCard
                key={post.id}
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                published_at={post.published_at}
                reading_time_minutes={post.reading_time_minutes}
                featured_image_url={post.featured_image_url}
                categories={post.blog_post_categories ?? []}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">
              No posts in this category yet.
            </p>
          </div>
        )}
      </section>
    </>
  )
}
