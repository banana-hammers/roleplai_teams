-- Add onboarding tracking fields to profiles table
-- Migration: Add onboarding_completed and alias columns for account creation flow

-- Add onboarding_completed flag and alias username
ALTER TABLE profiles
  ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN alias TEXT UNIQUE;

-- Create index for alias lookups (used for uniqueness check API)
CREATE INDEX idx_profiles_alias ON profiles(alias) WHERE alias IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Tracks whether user has completed the onboarding flow (identity creation)';
COMMENT ON COLUMN profiles.alias IS 'Unique username/alias chosen by user during onboarding';
