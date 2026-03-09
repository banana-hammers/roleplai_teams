-- Blog tables for public-facing thought leadership content

-- Helper function for admin checks (co-founder UUIDs)
CREATE OR REPLACE FUNCTION is_blog_admin(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  -- Co-founder UUIDs: Ryan, Anthony, Rob, Thomas
  SELECT uid = ANY(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid
  ]);
$$;

-- Blog categories
CREATE TABLE blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);

-- Blog posts
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL DEFAULT '',
  excerpt text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured_image_url text,
  meta_title text,
  meta_description text,
  og_image_url text,
  reading_time_minutes integer DEFAULT 1,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);

-- Junction: posts <-> categories
CREATE TABLE blog_post_categories (
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- RLS Policies

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;

-- Public read for categories
CREATE POLICY "Anyone can read blog categories"
  ON blog_categories FOR SELECT
  USING (true);

-- Admin write for categories
CREATE POLICY "Admins can manage blog categories"
  ON blog_categories FOR ALL
  USING (is_blog_admin(auth.uid()))
  WITH CHECK (is_blog_admin(auth.uid()));

-- Public read for published posts only
CREATE POLICY "Anyone can read published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Admins can read all posts (including drafts)
CREATE POLICY "Admins can read all blog posts"
  ON blog_posts FOR SELECT
  USING (is_blog_admin(auth.uid()));

-- Admin write for posts
CREATE POLICY "Admins can manage blog posts"
  ON blog_posts FOR ALL
  USING (is_blog_admin(auth.uid()))
  WITH CHECK (is_blog_admin(auth.uid()));

-- Public read for post categories (only for published posts)
CREATE POLICY "Anyone can read blog post categories"
  ON blog_post_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.id = post_id
      AND blog_posts.status = 'published'
    )
  );

-- Admins can read all post categories
CREATE POLICY "Admins can read all blog post categories"
  ON blog_post_categories FOR SELECT
  USING (is_blog_admin(auth.uid()));

-- Admin write for post categories
CREATE POLICY "Admins can manage blog post categories"
  ON blog_post_categories FOR ALL
  USING (is_blog_admin(auth.uid()))
  WITH CHECK (is_blog_admin(auth.uid()));

-- Seed initial categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('AI Identity', 'ai-identity', 'Building consistent AI personalities and brand voice'),
  ('Product Updates', 'product-updates', 'New features and improvements to RoleplAI Teams'),
  ('Startup Insights', 'startup-insights', 'Lessons and strategies for SaaS startups using AI'),
  ('Engineering', 'engineering', 'Technical deep dives into how we build RoleplAI Teams');
