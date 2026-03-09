'use server'

import { requireAuth } from '@/lib/supabase/auth-helpers'
import { isAdmin } from '@/lib/blog/admin'
import { calculateReadingTime } from '@/lib/blog/utils'
import { revalidatePath } from 'next/cache'

interface CreateBlogPostData {
  title: string
  slug: string
  content: string
  excerpt?: string
  featured_image_url?: string
  meta_title?: string
  meta_description?: string
  og_image_url?: string
  category_ids?: string[]
}

interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  status?: 'draft' | 'published'
}

export async function createBlogPost(data: CreateBlogPostData) {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  if (!isAdmin(user.id)) return { success: false, error: 'Unauthorized' }

  const reading_time_minutes = calculateReadingTime(data.content)

  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      author_id: user.id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt ?? null,
      featured_image_url: data.featured_image_url ?? null,
      meta_title: data.meta_title ?? null,
      meta_description: data.meta_description ?? null,
      og_image_url: data.og_image_url ?? null,
      reading_time_minutes,
    })
    .select('id')
    .single()

  if (error || !post) {
    console.error('Blog post creation error:', error)
    return { success: false, error: 'Failed to create post' }
  }

  // Link categories
  if (data.category_ids?.length) {
    await supabase
      .from('blog_post_categories')
      .insert(data.category_ids.map(cid => ({
        post_id: post.id,
        category_id: cid,
      })))
  }

  revalidatePath('/blog')
  return { success: true, postId: post.id }
}

export async function updateBlogPost(postId: string, data: UpdateBlogPostData) {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  if (!isAdmin(user.id)) return { success: false, error: 'Unauthorized' }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (data.title !== undefined) updates.title = data.title
  if (data.slug !== undefined) updates.slug = data.slug
  if (data.content !== undefined) {
    updates.content = data.content
    updates.reading_time_minutes = calculateReadingTime(data.content)
  }
  if (data.excerpt !== undefined) updates.excerpt = data.excerpt
  if (data.featured_image_url !== undefined) updates.featured_image_url = data.featured_image_url
  if (data.meta_title !== undefined) updates.meta_title = data.meta_title
  if (data.meta_description !== undefined) updates.meta_description = data.meta_description
  if (data.og_image_url !== undefined) updates.og_image_url = data.og_image_url
  if (data.status !== undefined) updates.status = data.status

  const { error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', postId)

  if (error) {
    console.error('Blog post update error:', error)
    return { success: false, error: 'Failed to update post' }
  }

  // Update categories if provided
  if (data.category_ids !== undefined) {
    await supabase.from('blog_post_categories').delete().eq('post_id', postId)
    if (data.category_ids.length) {
      await supabase
        .from('blog_post_categories')
        .insert(data.category_ids.map(cid => ({
          post_id: postId,
          category_id: cid,
        })))
    }
  }

  revalidatePath('/blog')
  return { success: true }
}

export async function deleteBlogPost(postId: string) {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  if (!isAdmin(user.id)) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase.from('blog_posts').delete().eq('id', postId)

  if (error) {
    console.error('Blog post deletion error:', error)
    return { success: false, error: 'Failed to delete post' }
  }

  revalidatePath('/blog')
  return { success: true }
}

export async function publishBlogPost(postId: string) {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  if (!isAdmin(user.id)) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('blog_posts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) {
    console.error('Blog post publish error:', error)
    return { success: false, error: 'Failed to publish post' }
  }

  revalidatePath('/blog')
  return { success: true }
}

export async function unpublishBlogPost(postId: string) {
  const auth = await requireAuth()
  if ('error' in auth) return { success: false, error: auth.error }
  const { supabase, user } = auth

  if (!isAdmin(user.id)) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('blog_posts')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) {
    console.error('Blog post unpublish error:', error)
    return { success: false, error: 'Failed to unpublish post' }
  }

  revalidatePath('/blog')
  return { success: true }
}
