import { Suspense } from 'react'
import { getPublishedPosts, getCategories } from '@/lib/blog/queries'
import { BlogHeader } from '@/components/blog/blog-header'
import { BlogPostCard } from '@/components/blog/blog-post-card'
import { BlogCategoryFilter } from '@/components/blog/blog-category-filter'

export const metadata = {
  title: 'Blog | RoleplAI Teams',
  description: 'Thoughts on AI identity, brand voice at scale, and the future of AI agents for SaaS startups.',
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const [posts, categories] = await Promise.all([
    getPublishedPosts(category),
    getCategories(),
  ])

  return (
    <>
      <BlogHeader />

      <section className="mx-auto max-w-6xl px-6 pb-24">
        {/* Category filter */}
        <Suspense fallback={null}>
          <div className="mb-8">
            <BlogCategoryFilter categories={categories} />
          </div>
        </Suspense>

        {/* Post grid */}
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
              {category ? 'No posts found in this category.' : 'No posts yet. Check back soon!'}
            </p>
          </div>
        )}
      </section>
    </>
  )
}
