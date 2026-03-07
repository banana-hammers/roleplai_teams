-- Fix: Replace get_monthly_spend to use auth.uid() instead of accepting a user ID parameter
-- This prevents any authenticated user from querying another user's spend data

-- Drop the old function signature
DROP FUNCTION IF EXISTS get_monthly_spend(UUID);

-- Create the secure version that uses auth.uid() directly
CREATE OR REPLACE FUNCTION get_monthly_spend()
RETURNS NUMERIC AS $$
  SELECT COALESCE(
    SUM(
      COALESCE((m.metadata->'usage'->>'cost')::NUMERIC, 0)
    ),
    0
  )
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE c.user_id = auth.uid()
    AND m.role = 'assistant'
    AND m.created_at >= date_trunc('month', NOW())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_monthly_spend() TO authenticated;
