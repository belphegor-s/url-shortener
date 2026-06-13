-- Link expiry (nullable = never expires) and soft-disable flag.
ALTER TABLE urls ADD COLUMN expires_at TIMESTAMP;
ALTER TABLE urls ADD COLUMN active INTEGER NOT NULL DEFAULT 1;

-- Back the dedup lookup (SELECT id FROM urls WHERE original_url = ?) — was a full table scan.
CREATE INDEX IF NOT EXISTS idx_urls_original_url ON urls(original_url);

-- Speed the per-link detail view (WHERE short_id = ? ORDER BY timestamp DESC).
CREATE INDEX IF NOT EXISTS idx_analytics_short_ts ON analytics(short_id, timestamp);
