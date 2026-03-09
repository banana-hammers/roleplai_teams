-- Allow public reads of blog author profiles (name only)
-- Needed so unauthenticated visitors can see author names on blog posts
CREATE POLICY "Anyone can read blog author profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts
      WHERE blog_posts.author_id = profiles.id
      AND blog_posts.status = 'published'
    )
  );
