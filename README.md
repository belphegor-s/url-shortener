# URL Shortener API with Analytics

A blazingly fast, production-grade URL shortener built on **Cloudflare Workers + D1 + KV**, using [Hono](https://hono.dev). Create short URLs, redirect at the edge, and track per-click analytics.

## Architecture

- **Edge cache (KV).** The redirect hot path (`GET /:id`) is read-through cached in Workers KV — warm short-codes resolve globally at the edge without touching D1.
- **Non-blocking analytics.** Click records are written via `waitUntil`, so the redirect returns immediately and never waits on a D1 write.
- **D1 (SQLite).** Source of truth for links, analytics, and admin sessions, with indexes backing dedup and per-link analytics queries.
- **Admin dashboard.** A React + Vite SPA served by the Worker at `/admin`, behind session-cookie auth (see below).
- **Rate limiting** on `POST /create` and admin login, **link expiry / soft-disable**, **constant-time** auth.

```
src/
  index.ts            App wiring, CORS, rate limit, assets routing, error handling
  types.ts            Bindings + shared types
  lib/                auth, admin-auth, session, cache (KV), links, id, validation, url, responses
  routes/             redirect, create, analytics, admin (dashboard API), assets (SPA)
  openapi/spec.ts     Swagger spec
admin/                React + Vite + Tailwind admin dashboard (builds to ../dist-admin)
migrations/           D1 migrations (0001_init, 0002_perf_expiry, 0003_sessions)
test/                 Vitest (pool-workers) suite
```

### Admin dashboard

A password-protected, single-user dashboard at `https://<domain>/admin`:

- **Auth** — session cookie (`__Host-session`, HttpOnly, Secure, SameSite=Lax). The token is stored in D1 as a SHA-256 hash; a **synchronizer CSRF token** is required (`X-CSRF-Token`) on all mutations. Login is rate-limited.
- **Sessions** — every login records IP, user-agent, and country; active sessions are listed and individually **revocable**.
- **Features** — overview (clicks trend, top links/countries/referrers), link management (create / search / toggle / expiry / delete), per-link click records with search, all fully mobile-responsive.

Credentials come from secrets (`ADMIN_USERNAME`, `ADMIN_PASSWORD`).

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

### 3. Set secrets

The programmatic analytics API uses a bearer token (`API_KEY`); the dashboard uses `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

```bash
wrangler secret put API_KEY
wrangler secret put ADMIN_USERNAME
wrangler secret put ADMIN_PASSWORD
```

For local dev, create `.dev.vars` (gitignored):

```
API_KEY=local-dev-secret
ADMIN_USERNAME=ayush
ADMIN_PASSWORD=local-dev-password
```

### 4. Apply migrations

```bash
npm run migrate:local   # local D1
npm run migrate         # remote D1
```

### 5. Run

```bash
wrangler login
npm run admin:install   # install dashboard deps (once)

# Local dev — two servers:
npm run dev             # Worker API on :8787
npm run dev:admin       # dashboard on :5173 (proxies /api to the Worker)

# Deploy (predeploy builds the dashboard into dist-admin automatically):
npm run deploy
```

The dashboard is reachable at `/admin`. In local dev, open the Vite server (`http://localhost:5173/admin`); in production it is served by the Worker from the `ASSETS` binding.

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
