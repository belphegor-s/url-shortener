-- Per-account programmatic API keys. Only sha256(raw key) is stored, so a DB leak
-- never yields a usable key. `prefix` is a short, non-secret fragment for display.
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,          -- sha256(raw key), hex
  user_id TEXT NOT NULL,
  name TEXT,
  prefix TEXT NOT NULL,         -- e.g. "shrt_AbCdEf" for identification in the UI
  created_at INTEGER NOT NULL,  -- epoch millis
  last_used_at INTEGER          -- epoch millis, nullable
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
