-- Initial Schema for Roleplai Teams
-- Phase 2: Database setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Identity Cores table
CREATE TABLE identity_cores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  voice TEXT NOT NULL,
  priorities JSONB DEFAULT '{}',
  boundaries JSONB DEFAULT '{}',
  decision_rules JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE identity_cores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own identity core"
  ON identity_cores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identity core"
  ON identity_cores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own identity core"
  ON identity_cores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own identity core"
  ON identity_cores FOR DELETE
  USING (auth.uid() = user_id);

-- Context Packs table
CREATE TYPE context_pack_type AS ENUM ('bio', 'brand', 'rules', 'custom');

CREATE TABLE context_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  type context_pack_type NOT NULL DEFAULT 'custom',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE context_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own context packs"
  ON context_packs FOR ALL
  USING (auth.uid() = user_id);

-- Roles table
CREATE TYPE approval_policy AS ENUM ('always', 'never', 'smart');

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  identity_facets JSONB DEFAULT '{}',
  allowed_tools JSONB DEFAULT '[]',
  approval_policy approval_policy NOT NULL DEFAULT 'smart',
  model_preference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own roles"
  ON roles FOR ALL
  USING (auth.uid() = user_id);

-- Role-Context Pack junction table
CREATE TABLE role_context_packs (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  context_pack_id UUID NOT NULL REFERENCES context_packs(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, context_pack_id)
);

ALTER TABLE role_context_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can link own resources"
  ON role_context_packs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roles WHERE id = role_id AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM context_packs WHERE id = context_pack_id AND user_id = auth.uid()
    )
  );

-- Skills table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  input_schema JSONB DEFAULT '{}',
  tool_constraints JSONB DEFAULT '{}',
  examples JSONB DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  parent_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own skills"
  ON skills FOR ALL
  USING (auth.uid() = user_id);

-- Tasks table
CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed', 'requires_approval');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  input JSONB NOT NULL,
  output TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  trace JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);

-- Task Approvals table
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE task_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  proposed_action JSONB NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE task_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage approvals for own tasks"
  ON task_approvals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE id = task_id AND user_id = auth.uid()
    )
  );

-- User API Keys table (BYO keys)
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  label TEXT,
  spend_limit NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
  ON user_api_keys FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_identity_cores_user_id ON identity_cores(user_id);
CREATE INDEX idx_context_packs_user_id ON context_packs(user_id);
CREATE INDEX idx_roles_user_id ON roles(user_id);
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_identity_cores_updated_at BEFORE UPDATE ON identity_cores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_context_packs_updated_at BEFORE UPDATE ON context_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
