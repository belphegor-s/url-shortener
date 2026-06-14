export type Bindings = {
	/** D1 database holding urls + analytics. */
	DB: D1Database;
	/** Static bearer token guarding the analytics endpoints. */
	API_KEY: string;
	/** Read-through cache for short-code -> link lookups (hot redirect path). */
	LINKS_KV: KVNamespace;
	/** Rate limit binding applied to POST /create. */
	CREATE_LIMITER: RateLimiter;
	/** Rate limit binding applied to admin login (brute-force guard). */
	LOGIN_LIMITER: RateLimiter;
	/** Static assets binding serving the built admin dashboard (dist-admin). */
	ASSETS: Fetcher;
	/** Admin dashboard credentials (set via `wrangler secret put`). */
	ADMIN_USERNAME: string;
	ADMIN_PASSWORD: string;
	/** Comma-separated list of allowed CORS origins. Use "*" to allow any. */
	ALLOWED_ORIGINS?: string;
	/** Public origin used to build short URLs (e.g. https://short.procd.cc). Falls back to request origin. */
	SHORT_DOMAIN?: string;
};

/** Cloudflare rate-limit binding shape (configured via the `ratelimit` unsafe binding). */
export interface RateLimiter {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** Cached link shape stored in KV. Kept terse to minimise payload size. */
export interface CachedLink {
	/** original_url */
	u: string;
	/** expires_at as epoch millis, or null = never */
	e: number | null;
	/** active flag */
	a: boolean;
}

/** Variables attached to the Hono context by middleware. */
export type Variables = {
	/** Present after the admin-auth middleware authenticates a request. */
	sessionId: string;
	csrf: string;
};

/** Hono environment type used across routes. */
export type AppEnv = { Bindings: Bindings; Variables: Variables };
