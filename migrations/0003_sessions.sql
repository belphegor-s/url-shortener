-- Admin login sessions. `id` stores sha256(token) so a DB leak never yields a usable cookie.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,          -- sha256(raw token), hex
  csrf TEXT NOT NULL,           -- synchronizer CSRF token (random)
  ip TEXT,
  user_agent TEXT,
  country_code TEXT,
  created_at INTEGER NOT NULL,  -- epoch millis
  last_seen INTEGER NOT NULL,   -- epoch millis
  expires_at INTEGER NOT NULL   -- epoch millis
);

-- Sweep / lookup expired sessions efficiently.
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
