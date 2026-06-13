# URL Shortener API with Analytics

A blazingly fast, production-grade URL shortener built on **Cloudflare Workers + D1 + KV**, using [Hono](https://hono.dev). Create short URLs, redirect at the edge, and track per-click analytics.

## Architecture

- **Edge cache (KV).** The redirect hot path (`GET /:id`) is read-through cached in Workers KV — warm short-codes resolve globally at the edge without touching D1.
- **Non-blocking analytics.** Click records are written via `waitUntil`, so the redirect returns immediately and never waits on a D1 write.
- **D1 (SQLite).** Source of truth for links + analytics, with indexes backing dedup and per-link analytics queries.
- **Rate limiting** on `POST /create`, **link expiry / soft-disable**, **constant-time** API-key auth on analytics endpoints.

```
src/
  index.ts            App wiring, CORS, rate limit, error handling
  types.ts            Bindings + shared types
  lib/                auth, cache (KV), id, validation, responses
  routes/             redirect, create, analytics
  openapi/spec.ts     Swagger spec
migrations/           D1 migrations (0001_init, 0002_perf_expiry)
test/                 Vitest (pool-workers) suite
```

## Setup & Configuration

### Prerequisites

- [Cloudflare Workers](https://workers.cloudflare.com/) account
- [D1 Database](https://developers.cloudflare.com/d1) + [KV Namespace](https://developers.cloudflare.com/kv)
- Node.js 20+

### 1. Clone & install

```bash
git clone https://github.com/belphegor-s/url-shortner
cd url-shortner
npm install
```

### 2. Provision resources

```bash
# D1 — set the printed database_id in wrangler.jsonc
wrangler d1 create url_shortener_db

# KV — set the printed id in wrangler.jsonc (replaces REPLACE_WITH_LINKS_KV_ID)
wrangler kv namespace create LINKS_KV
```

Update `wrangler.jsonc` with both ids:

```jsonc
"d1_databases": [{ "binding": "DB", "database_name": "url_shortener_db", "database_id": "<your_d1_id>", "migrations_dir": "./migrations" }],
"kv_namespaces": [{ "binding": "LINKS_KV", "id": "<your_kv_id>" }]
```

### 3. Set the API key

The analytics endpoints are guarded by a bearer token (`API_KEY`).

```bash
# Production secret
wrangler secret put API_KEY
```

For local dev, create `.dev.vars` (gitignored):

```
API_KEY=local-dev-secret
```

### 4. Apply migrations

```bash
npm run migrate:local   # local D1
npm run migrate         # remote D1
```

### 5. Run

```bash
wrangler login
npm run dev             # local dev server
npm run deploy          # deploy to Cloudflare
```

## API Endpoints

### `POST /create` — create a short URL

JSON body:

```json
{
  "url": "https://example.com",
  "custom_id": "mycode",        // optional, [a-zA-Z0-9_-]{1,64}, not a reserved word
  "expires_in": 86400           // optional seconds; or "expires_at": "2026-12-31T23:59:59Z"
}
```

Response `201`:

```json
{
  "short_url": "https://short.procd.cc/mycode",
  "id": "mycode",
  "expires_at": null,
  "existing": false
}
```

Posting an already-shortened URL (no `custom_id`) returns the existing link with `existing: true`. Rate limited per client IP.

### `GET /:id` — redirect

`302` to the original URL and records a click (IP, user-agent, country, referrer). Returns `404` for unknown codes, `410` for expired/inactive links.

### `GET /analytics` — summary _(auth)_

Query params: `page`, `limit` (default 50, max 500), `sort` (`asc`/`desc`).

### `DELETE /analytics` — delete links + analytics _(auth)_

JSON body: `{ "ids": ["abc123", "xyz456"] }`. Also evicts the KV cache.

### `GET /analytics/:id` — per-link detail _(auth)_

Most recent 1000 clicks for one short code.

**Auth:** protected endpoints require `Authorization: Bearer <API_KEY>`.

## Testing

```bash
npm test          # Vitest (Cloudflare Workers pool)
npm run typecheck # tsc --noEmit
```

## Swagger UI

Interactive docs at the root route `/` — live at [short.procd.cc](https://short.procd.cc).

## License

MIT — see [LICENSE](LICENSE).
