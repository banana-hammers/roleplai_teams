-- Remove Unused Agent SDK Fields
-- These fields were added for Agent SDK integration that was not implemented

-- Drop sdk_session_id from conversations table
ALTER TABLE conversations DROP COLUMN IF EXISTS sdk_session_id;

-- Drop tool_config from roles table
ALTER TABLE roles DROP COLUMN IF EXISTS tool_config;
