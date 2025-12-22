-- Progressive Disclosure for Skills
-- Adds support for 3-level progressive disclosure and tool-enabled skills

-- Level 1: Short description for system prompt (lean)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Level 2: Detailed instructions loaded on skill invocation
ALTER TABLE skills ADD COLUMN IF NOT EXISTS detailed_instructions TEXT;

-- Level 2: Examples for few-shot learning
ALTER TABLE skills ADD COLUMN IF NOT EXISTS examples JSONB DEFAULT '[]';

-- Level 3: Linked lore IDs for domain knowledge injection
ALTER TABLE skills ADD COLUMN IF NOT EXISTS linked_lore_ids UUID[] DEFAULT '{}';

-- Tool-enabled skills: which tools this skill can call
ALTER TABLE skills ADD COLUMN IF NOT EXISTS allowed_tools TEXT[] DEFAULT '{}';

-- Populate short_description from first sentence of description for existing skills
UPDATE skills
SET short_description = CASE
  WHEN description IS NULL THEN NULL
  WHEN position('.' IN description) > 0 THEN
    substring(description FROM 1 FOR position('.' IN description))
  WHEN length(description) <= 100 THEN
    description
  ELSE
    substring(description FROM 1 FOR 100) || '...'
END
WHERE short_description IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN skills.short_description IS 'Level 1: Brief description for system prompt (~50-100 chars)';
COMMENT ON COLUMN skills.detailed_instructions IS 'Level 2: Rich guidance loaded when skill is invoked';
COMMENT ON COLUMN skills.examples IS 'Level 2: Input/output examples for few-shot learning';
COMMENT ON COLUMN skills.linked_lore_ids IS 'Level 3: Lore IDs to inject as context during execution';
COMMENT ON COLUMN skills.allowed_tools IS 'Tools this skill can call (web_search, web_fetch, mcp_*, skill names)';
