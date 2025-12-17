-- Migration: Add conversations (chat history) and role_skills junction table
-- This enables:
-- 1. Persistent chat history with RoleplAIrs ("memories from past conversations")
-- 2. Many-to-many relationship between roles and skills (skills reusable across RoleplAIrs)

-- ============================================================================
-- CONVERSATIONS TABLE (Chat History)
-- ============================================================================
-- Stores conversation sessions between users and their RoleplAIrs

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  title TEXT, -- Optional title (can be auto-generated from first message)
  summary TEXT, -- AI-generated summary for quick recall
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_role_id ON conversations(role_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
-- Individual messages within a conversation
-- Stored separately from conversations for efficient querying and pagination

CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- For tool calls, attachments, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages in own conversations"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ============================================================================
-- ROLE_SKILLS JUNCTION TABLE
-- ============================================================================
-- Many-to-many relationship between roles (RoleplAIrs) and skills
-- Allows skills to be shared/reused across multiple RoleplAIrs

CREATE TABLE role_skills (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  -- Per-role skill configuration overrides
  config_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, skill_id)
);

ALTER TABLE role_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can link own roles and skills"
  ON role_skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roles WHERE id = role_id AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM skills WHERE id = skill_id AND user_id = auth.uid()
    )
  );

CREATE INDEX idx_role_skills_role_id ON role_skills(role_id);
CREATE INDEX idx_role_skills_skill_id ON role_skills(skill_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE conversations IS 'Chat sessions between users and their RoleplAIrs';
COMMENT ON TABLE messages IS 'Individual messages within a conversation';
COMMENT ON TABLE role_skills IS 'Many-to-many junction linking RoleplAIrs to Skills';
COMMENT ON COLUMN conversations.summary IS 'AI-generated summary for quick context recall';
COMMENT ON COLUMN messages.metadata IS 'Additional data: tool calls, attachments, token counts, etc.';
COMMENT ON COLUMN role_skills.config_overrides IS 'Per-role overrides for skill configuration';
