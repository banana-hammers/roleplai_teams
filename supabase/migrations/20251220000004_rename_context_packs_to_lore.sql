-- Rename Context Packs to Lore
-- Aligning database terminology with user-facing branding

-- Rename context_packs table to lore
ALTER TABLE context_packs RENAME TO lore;

-- Rename role_context_packs junction table to role_lore
ALTER TABLE role_context_packs RENAME TO role_lore;

-- Rename the context_pack_id column in role_lore to lore_id
ALTER TABLE role_lore RENAME COLUMN context_pack_id TO lore_id;

-- Rename the enum type
ALTER TYPE context_pack_type RENAME TO lore_type;

-- Update RLS policy names for clarity (optional but helpful)
-- Note: PostgreSQL doesn't have ALTER POLICY ... RENAME, so we drop and recreate

-- Drop old policies on lore (formerly context_packs)
DROP POLICY IF EXISTS "Users can manage own context packs" ON lore;

-- Create new policy with updated name
CREATE POLICY "Users can manage own lore"
  ON lore FOR ALL
  USING (auth.uid() = user_id);

-- Drop old policies on role_lore (formerly role_context_packs)
DROP POLICY IF EXISTS "Users can link own resources" ON role_lore;

-- Create new policy with updated name
CREATE POLICY "Users can link own lore"
  ON role_lore FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roles WHERE id = role_id AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM lore WHERE id = lore_id AND user_id = auth.uid()
    )
  );

-- Update index names (if they exist)
ALTER INDEX IF EXISTS idx_context_packs_user_id RENAME TO idx_lore_user_id;
