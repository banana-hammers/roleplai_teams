-- Fix: Add unique constraint on (user_id, provider) to prevent duplicate API key entries
-- resolveApiKey uses .maybeSingle() which throws if multiple rows match

ALTER TABLE user_api_keys ADD CONSTRAINT user_api_keys_user_provider_unique
  UNIQUE (user_id, provider);
