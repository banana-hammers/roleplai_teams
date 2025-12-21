-- Remove allowed_tools Column
-- Skills are now tracked exclusively via role_skills junction table

-- Drop the allowed_tools JSONB column from roles table
ALTER TABLE roles DROP COLUMN IF EXISTS allowed_tools;
