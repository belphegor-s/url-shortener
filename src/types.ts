export type Bindings = {
	/** D1 database holding users + urls + analytics. */
	DB: D1Database;
	/** Read-through cache for short-code -> link lookups (hot redirect path). */
	LINKS_KV: KVNamespace;
	/** Rate limit binding applied to POST /create. */
	CREATE_LIMITER: RateLimiter;
	/** Rate limit binding applied to auth start (brute-force guard). */
	LOGIN_LIMITER: RateLimiter;
	/** Static assets binding serving the built dashboard. */
	ASSETS: Fetcher;

	/** GitHub OAuth app credentials. `GITHUB_CLIENT_ID` is public; the secret is a secret. */
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;

	/** GitHub login(s) that are granted the platform-admin role on sign-in. Comma-separated. */
	ADMIN_GITHUB_LOGIN?: string;
	/** GitHub email(s) that are granted the platform-admin role on sign-in. Comma-separated. */
	ADMIN_GITHUB_EMAIL?: string;

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

/** A GitHub-backed account. */
export interface User {
	id: string;
	githubId: string;
	login: string;
	name: string | null;
	email: string | null;
	avatarUrl: string | null;
	role: 'user' | 'admin';
}

/** Raw `users` row. */
export interface UserRow {
	id: string;
	github_id: string;
	login: string;
	name: string | null;
	email: string | null;
	avatar_url: string | null;
	role: string;
	created_at: number;
	last_login: number;
}

/** Variables attached to the Hono context by middleware. */
export type Variables = {
	/** Present after the auth middleware authenticates a request. */
	sessionId: string;
	/** Synchronizer CSRF token bound to the session. */
	csrf: string;
	/** Authenticated user (set by the session or API-key guard). */
	user: User;
	/** Present when the request authenticated via a per-account API key. */
	apiKeyId?: string;
};

/** Hono environment type used across routes. */
export type AppEnv = { Bindings: Bindings; Variables: Variables };
