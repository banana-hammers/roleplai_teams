import { createClient } from '@/lib/supabase/server'

export async function getPublishedPosts(categorySlug?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('blog_posts')
    .select(`
      id, title, slug, excerpt, featured_image_url,
      reading_time_minutes, published_at, created_at,
      author_id,
      profiles!blog_posts_author_id_fkey(full_name),
      blog_post_categories(
        category_id,
        blog_categories(id, name, slug)
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (categorySlug) {
    // Filter by category via subquery
    const { data: category } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (!category) return []

    const { data: postIds } = await supabase
      .from('blog_post_categories')
      .select('post_id')
      .eq('category_id', category.id)

    if (!postIds?.length) return []

    query = query.in('id', postIds.map(p => p.post_id))
  }

  const { data: posts, error } = await query

  if (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }

  return posts ?? []
}

export async function getPostBySlug(slug: string) {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      profiles!blog_posts_author_id_fkey(full_name),
      blog_post_categories(
        category_id,
        blog_categories(id, name, slug)
      )
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching blog post:', error)
    return null
  }

  return post
}

export async function getCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data ?? []
}

export async function getRelatedPosts(postId: string, categoryIds: string[], limit = 3) {
  const supabase = await createClient()

  if (!categoryIds.length) return []

  // Get post IDs in the same categories
  const { data: relatedPostIds } = await supabase
    .from('blog_post_categories')
    .select('post_id')
    .in('category_id', categoryIds)
    .neq('post_id', postId)

  if (!relatedPostIds?.length) return []

  const uniqueIds = [...new Set(relatedPostIds.map(r => r.post_id))]

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      id, title, slug, excerpt, featured_image_url,
      reading_time_minutes, published_at
    `)
    .eq('status', 'published')
    .in('id', uniqueIds)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching related posts:', error)
    return []
  }

  return posts ?? []
}
