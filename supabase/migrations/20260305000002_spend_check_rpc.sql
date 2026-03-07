-- RPC function to get total spend for a user in the current calendar month
-- Used by the chat endpoint to enforce spend limits

CREATE OR REPLACE FUNCTION get_monthly_spend(p_user_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(
    SUM(
      COALESCE((m.metadata->'usage'->>'cost')::NUMERIC, 0)
    ),
    0
  )
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE c.user_id = p_user_id
    AND m.role = 'assistant'
    AND m.created_at >= date_trunc('month', NOW())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_monthly_spend(UUID) TO authenticated;
