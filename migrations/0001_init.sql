-- Table to store URLs
CREATE TABLE IF NOT EXISTS urls (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store analytics data for each redirect
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  short_id TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  country_code TEXT,
  referrer TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient lookup of analytics by short_id
CREATE INDEX IF NOT EXISTS idx_analytics_short_id ON analytics(short_id);
