-- Identity Core Refactor Migration
-- 1. Convert priorities from JSONB {key: level} to TEXT[] ordered array (top 3 ranked)
-- 2. Delete decision_rules column entirely (redundant with voice/priorities/boundaries)

-- Step 1: Add new priorities column as TEXT[]
ALTER TABLE identity_cores ADD COLUMN priorities_ranked TEXT[] DEFAULT '{}';

-- Step 2: Migrate existing data (extract 'high' priorities as ranked array)
-- Note: We order alphabetically since the old format had no ranking concept
UPDATE identity_cores
SET priorities_ranked = (
  SELECT COALESCE(array_agg(key ORDER BY key), '{}')
  FROM jsonb_each_text(priorities)
  WHERE value = 'high'
);

-- Step 3: Drop old JSONB priorities column and rename new one
ALTER TABLE identity_cores DROP COLUMN priorities;
ALTER TABLE identity_cores RENAME COLUMN priorities_ranked TO priorities;

-- Step 4: Delete decision_rules column entirely
ALTER TABLE identity_cores DROP COLUMN decision_rules;

-- Add comment explaining the new schema
COMMENT ON COLUMN identity_cores.priorities IS 'Ordered array of top 3 priority values (e.g., ["accuracy", "empathy", "clarity"])';
