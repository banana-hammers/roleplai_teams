-- Migration: Add Claude Agent SDK Support
-- Adds session tracking, MCP servers, and tool configuration

-- 1. Add SDK session ID to conversations for resume support
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sdk_session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_conversations_sdk_session_id ON conversations(sdk_session_id);

-- 2. Add tool configuration to roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS tool_config JSONB DEFAULT '{}';

COMMENT ON COLUMN roles.tool_config IS 'Claude Agent SDK tool permissions: builtInTools, webTools, mcpToolPatterns, disallowedTools, requireApproval';

-- 3. Create MCP servers table
CREATE TABLE IF NOT EXISTS mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  server_type TEXT NOT NULL CHECK (server_type IN ('stdio', 'sse', 'http')),
  config JSONB NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE mcp_servers IS 'Model Context Protocol server configurations per user/role';
COMMENT ON COLUMN mcp_servers.role_id IS 'NULL means user-level (applies to all roles)';
COMMENT ON COLUMN mcp_servers.config IS 'Server-specific config: command/args for stdio, url/headers for sse/http';

-- Unique constraint: one server per name per user per role
CREATE UNIQUE INDEX IF NOT EXISTS idx_mcp_servers_unique
  ON mcp_servers(user_id, name, COALESCE(role_id, '00000000-0000-0000-0000-000000000000'));

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_mcp_servers_user_id ON mcp_servers(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_role_id ON mcp_servers(role_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_enabled ON mcp_servers(is_enabled) WHERE is_enabled = true;

-- Enable RLS
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own MCP servers
CREATE POLICY "Users can view own MCP servers"
  ON mcp_servers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own MCP servers"
  ON mcp_servers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MCP servers"
  ON mcp_servers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own MCP servers"
  ON mcp_servers FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Update tasks table to better support SDK task tracking
-- Add index for conversation-based task queries
CREATE INDEX IF NOT EXISTS idx_tasks_trace_conversation
  ON tasks USING GIN ((trace -> 'conversation_id'));

-- 5. Add trigger for updated_at on mcp_servers
CREATE OR REPLACE FUNCTION update_mcp_servers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mcp_servers_updated_at ON mcp_servers;
CREATE TRIGGER mcp_servers_updated_at
  BEFORE UPDATE ON mcp_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_mcp_servers_updated_at();
