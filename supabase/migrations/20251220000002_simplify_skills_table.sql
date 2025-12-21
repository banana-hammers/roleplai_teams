-- Simplify Skills Table
-- Remove unused versioning and training fields

-- Drop parent_skill_id column (skill versioning never implemented)
ALTER TABLE skills DROP COLUMN IF EXISTS parent_skill_id;

-- Drop examples column (training data never implemented)
ALTER TABLE skills DROP COLUMN IF EXISTS examples;

-- Keep version column for future leveling system
