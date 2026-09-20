# SHRT — URL Shortener with Edge Analytics

[![CI](https://github.com/belphegor-s/url-shortener/actions/workflows/ci.yml/badge.svg)](https://github.com/belphegor-s/url-shortener/actions/workflows/ci.yml)
[![Deploy](https://github.com/belphegor-s/url-shortener/actions/workflows/deploy.yml/badge.svg)](https://github.com/belphegor-s/url-shortener/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

> Source: **https://github.com/belphegor-s/url-shortener**

**Short links, long reach.** A production-grade, multi-user URL shortener built on **Cloudflare Workers + D1 + KV** with [Hono](https://hono.dev). GitHub sign-in, edge-cached redirects, per-click analytics, a server-rendered marketing site, and dynamic OG images.

## Highlights

- **Edge-cached redirects.** `GET /:id` is read-through cached in Workers KV, so warm short codes resolve at the edge without touching D1.
- **Non-blocking analytics.** Clicks are written via `waitUntil`, so the redirect never waits on a D1 write.
- **GitHub OAuth.** Passwordless sign-in. Each account gets a private dashboard; links are scoped to their owner.
- **Server-rendered public site.** Zero-build HTML/CSS in a shadcn-style design system (neutral zinc palette, one radius, light & dark themes), laid out on a blueprint grid: two dashed rails run the height of the page, dashed rules close each band, and crosshairs mark every intersection. Fully responsive down to 320px, with proper meta tags, JSON-LD, and a dynamic PNG OG image (`/og.png`).
- **One design system, both surfaces.** The React dashboard shares the same tokens, the same light/dark pair and the same `shrt-theme` preference as the marketing site, so a theme chosen on either carries to the other. Every loading state is a skeleton shaped like the content it replaces, not a spinner.
- **Hand-built API reference.** `/docs` is rendered by the Worker in the same design system instead of a third-party Swagger bundle, and the raw OpenAPI 3.1 document is served at `/openapi.json`.
- **Platform admins.** Accounts listed in `ADMIN_GITHUB_LOGIN` / `ADMIN_GITHUB_EMAIL` get an all-users view and a users directory.
- **Hardened.** Session cookies (`__Host-` prefix), hashed session tokens, synchronizer CSRF, constant-time auth, rate limiting, single-use OAuth state, and a strict CSP.

## Architecture

```
src/
  index.ts            App wiring, CORS, rate limit, routing, error handling
  types.ts            Bindings + shared types
  lib/                oauth, users, session, guards, links, cache (KV), id, validation, url, security, responses
  routes/             home (site + docs) · og · auth (GitHub) · api (dashboard) · create · analytics · assets · favicon · redirect
  landing/            Server-rendered public site
    chrome.ts         Shared shell: <head>, header with mobile menu, footer
    styles.ts         Design tokens + components (shadcn-style, light & dark)
    page.ts           Landing page
    docs.ts           API reference (+ docs-styles.ts)
    icons.ts          Inline SVG icon set
    script.ts         Theme, mobile menu, copy buttons, inline shortener
  openapi/spec.ts     OpenAPI 3.1 document (served at /openapi.json)
admin/                React + Vite + Tailwind dashboard (builds to ../dist-admin, served at /dashboard)
migrations/           D1 migrations (0001 init … 0004 users)
test/                 Vitest (pool-workers) suite
```

### Routes

| Route | Description |
| --- | --- |
| `/` | Server-rendered landing page (theme toggle, inline shortener when signed in) |
| `/docs` | API reference, server-rendered in the site's design system |
| `/openapi.json` | OpenAPI 3.1 document for client generators |
| `/og.png` | Dynamically generated social card (KV-cached) |
| `/auth/github` → `/auth/github/callback` | GitHub OAuth flow |
| `/dashboard` | React dashboard (Overview, Links, per-link analytics, Sessions, Users*) |
| `/api/*` | Dashboard JSON API (session + CSRF) |
| `/create` | Programmatic API — session **or** `Authorization: Bearer <account API key>` |
| `/analytics` | Programmatic analytics API — account API key, scoped to that account |
| `/:id` | Redirect (302) + click recording |

\* Users directory is visible to platform admins only.

## Setup

### Prerequisites

- A Cloudflare Workers account
- [D1](https://developers.cloudflare.com/d1) database + [KV](https://developers.cloudflare.com/kv) namespace
- Node.js 22+ (Wrangler 4 minimum). CI and `.nvmrc` use Node 24 LTS.
- A GitHub account (to create an OAuth App)

### 1. Clone & install

```bash
git clone https://github.com/belphegor-s/url-shortener
cd url-shortener
npm install
npm run admin:install
```

### 2. Provision resources & configure

```bash
wrangler d1 create url_shortener_db
wrangler kv namespace create LINKS_KV
```

Put the printed ids into `wrangler.jsonc` (`d1_databases[].database_id`, `kv_namespaces[].id`).

### 3. Create a GitHub OAuth App

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:

- **Application name:** SHRT
- **Homepage URL:** `https://short.procd.cc`
- **Authorization callback URL:** `https://short.procd.cc/auth/github/callback`

For local development, add a second OAuth App (or use the same one and swap the callback) pointing at `http://localhost:8787/auth/github/callback`.

Then set the client id in `wrangler.jsonc` (`GITHUB_CLIENT_ID`) and the secret as a Worker secret:

```bash
wrangler secret put GITHUB_CLIENT_SECRET
```

> There is **no global API key.** Programmatic access uses per-account keys created in the dashboard (**API keys** → New key), scoped to that account and revocable at any time.

### 4. Admins

`wrangler.jsonc` already designates the platform admin(s):

```jsonc
"ADMIN_GITHUB_LOGIN": "belphegor-s",
"ADMIN_GITHUB_EMAIL": "ayush2162002@gmail.com"
```

Both are comma-separated allow-lists (case-insensitive). A user is granted the `admin` role on sign-in if their GitHub login **or** verified email matches. The role is sticky: an existing admin is never downgraded, so removing the env var won't lock you out.

### 5. Migrate

```bash
npm run migrate:local   # local D1
npm run migrate         # remote D1
```

### 6. Run

```bash
# Worker on :8787 (landing, API, redirects, OAuth)
npm run dev

# Dashboard on :5173 (proxies /api, /auth, /create to the Worker)
npm run dev:admin
```

Open `http://localhost:5173/dashboard` for the SPA, or `http://localhost:8787` for the landing page. OAuth requires the local callback URL to be registered on the GitHub OAuth App.

## Deploy

```bash
npm run deploy   # predeploy builds the dashboard, then wrangler deploy
```

The Worker serves the built SPA from the `ASSETS` binding at `/dashboard`.

## API

### `POST /create`

Auth: either a signed-in session cookie, or `Authorization: Bearer <account API key>` (create keys in the dashboard). Created links are owned by that account.

```json
{
  "url": "https://example.com",
  "custom_id": "mycode",        // optional, [a-zA-Z0-9_-]{1,64}, not reserved
  "expires_in": 86400           // optional seconds; or "expires_at": "2026-12-31T23:59:59Z"
}
```

Response `201`:

```json
{ "short_url": "https://short.procd.cc/mycode", "id": "mycode", "expires_at": null, "existing": false }
```

### `GET /:id`

`302` to the target and records a click. `404` unknown, `410` expired/inactive.

### `GET /analytics` · `GET /analytics/:id` · `DELETE /analytics` _(account API key)_

Paginated summaries, a per-link click log, and batch deletion, all scoped to the key's owner. See [`/docs`](https://short.procd.cc/docs).

## Testing

```bash
npm test          # Vitest (Cloudflare Workers pool)
npm run typecheck # tsc --noEmit
```

## CI

Two workflows run on `main`:

- **`ci.yml`** — typecheck, Vitest suite, and a dashboard build on every push and pull request.
- **`deploy.yml`** — builds the dashboard, then `wrangler deploy`.

Deploys need a `CLOUDFLARE_API_TOKEN` repository secret with **Edit Cloudflare Workers** permission on the account in `wrangler.jsonc`. An expired or under-scoped token surfaces as `Authentication error [code: 10000]` / `Invalid access token [code: 9109]` in the deploy log.

## License

MIT — see [LICENSE.md](LICENSE.md).
