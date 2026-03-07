-- Rate limiting table for distributed rate limiting across Edge instances
CREATE TABLE rate_limit_entries (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_ms INTEGER NOT NULL
);

-- Index for periodic cleanup of expired windows
CREATE INDEX idx_rate_limit_window ON rate_limit_entries (window_start);

-- Atomic check-and-increment function
-- Returns whether the request is allowed, remaining count, and window reset time
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_ms INTEGER
) RETURNS TABLE(success BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_entry rate_limit_entries%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Upsert: create or get existing entry
  -- If window expired, reset count to 1; otherwise increment
  INSERT INTO rate_limit_entries (key, count, window_start, window_ms)
  VALUES (p_key, 1, v_now, p_window_ms)
  ON CONFLICT (key) DO UPDATE
  SET count = CASE
    WHEN rate_limit_entries.window_start + (rate_limit_entries.window_ms || ' milliseconds')::INTERVAL < v_now
    THEN 1  -- Window expired, reset
    ELSE rate_limit_entries.count + 1
  END,
  window_start = CASE
    WHEN rate_limit_entries.window_start + (rate_limit_entries.window_ms || ' milliseconds')::INTERVAL < v_now
    THEN v_now  -- Window expired, reset
    ELSE rate_limit_entries.window_start
  END,
  window_ms = p_window_ms
  RETURNING * INTO v_entry;

  success := v_entry.count <= p_limit;
  remaining := GREATEST(0, p_limit - v_entry.count);
  reset_at := v_entry.window_start + (v_entry.window_ms || ' milliseconds')::INTERVAL;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
