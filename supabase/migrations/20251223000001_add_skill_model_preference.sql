-- Add model_preference column to skills table
-- Allows skills to override the role's model preference for execution
-- Format: provider/model (e.g., anthropic/claude-haiku-4-5)

ALTER TABLE skills ADD COLUMN IF NOT EXISTS model_preference TEXT;

COMMENT ON COLUMN skills.model_preference IS
  'Optional model override for skill execution. Format: provider/model. Falls back to role model preference if not set.';
