-- GitHub-backed user accounts. Identity is anchored on github_id (stable, numeric) -
-- login/email can change and must never be the primary key.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,             -- internal id (random, opaque)
  github_id TEXT NOT NULL UNIQUE,  -- GitHub numeric id, as text
  login TEXT NOT NULL,             -- GitHub username (mutable)
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at INTEGER NOT NULL,     -- epoch millis
  last_login INTEGER NOT NULL      -- epoch millis
);

CREATE INDEX IF NOT EXISTS idx_users_github ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Link ownership. Existing (pre-auth) rows keep user_id = NULL and remain resolvable.
ALTER TABLE urls ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_urls_user ON urls(user_id, created_at);

-- Bind sessions to a user. Legacy sessions have user_id = NULL and stop resolving
-- (getSession requires both the row and a matching live user).
ALTER TABLE sessions ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Single-use OAuth state (CSRF + return-path), strongly consistent so callback validation
-- never races an eventually-consistent store.
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  return_to TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
