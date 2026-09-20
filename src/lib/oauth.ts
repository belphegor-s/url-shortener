import type { Bindings } from '../types';

/** OAuth state lifetime - an auth attempt must complete well within this. */
const STATE_TTL_MS = 10 * 60 * 1000;

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';
const GITHUB_API = 'https://api.github.com';

/** Only allow same-origin, absolute-path return targets (no protocol-relative `//evil.com`). */
export function safeReturnTo(value: unknown, fallback = '/dashboard'): string {
	if (typeof value !== 'string' || value.length === 0) return fallback;
	if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
	return value;
}

/** Build the GitHub authorize URL for a fresh state. */
export function githubAuthorizeUrl(env: Bindings, state: string, redirectUri: string): string {
	const params = new URLSearchParams({
		client_id: env.GITHUB_CLIENT_ID,
		redirect_uri: redirectUri,
		scope: 'read:user user:email',
		state,
		allow_signup: 'true',
	});
	return `${GITHUB_AUTHORIZE}?${params}`;
}

/** Persist a single-use state row bound to an optional return path. */
export async function createState(env: Bindings, returnTo: string): Promise<string> {
	const now = Date.now();
	const state = randomToken(24);
	await env.DB.prepare(`INSERT INTO oauth_states (state, return_to, created_at, expires_at) VALUES (?, ?, ?, ?)`)
		.bind(state, returnTo, now, now + STATE_TTL_MS)
		.run();
	// Opportunistic cleanup of expired rows (cheap, indexed).
	await env.DB.prepare(`DELETE FROM oauth_states WHERE expires_at <= ?`).bind(now).run();
	return state;
}

/**
 * Validate + burn a state. Returns the stored return path, or null when the state is
 * missing, expired, or already used (replay).
 */
export async function consumeState(env: Bindings, state: string | undefined): Promise<string | null> {
	if (!state) return null;
	const row = await env.DB.prepare(`SELECT return_to, expires_at FROM oauth_states WHERE state = ?`)
		.bind(state)
		.first<{ return_to: string | null; expires_at: number }>();
	if (!row) return null;
	await env.DB.prepare(`DELETE FROM oauth_states WHERE state = ?`).bind(state).run();
	if (row.expires_at <= Date.now()) return null;
	return row.return_to ?? '/dashboard';
}

/** Exchange an authorization code for an access token. Throws on failure. */
export async function exchangeCode(env: Bindings, code: string, redirectUri: string): Promise<string> {
	const res = await fetch(GITHUB_TOKEN, {
		method: 'POST',
		headers: { accept: 'application/json', 'content-type': 'application/json' },
		body: JSON.stringify({
			client_id: env.GITHUB_CLIENT_ID,
			client_secret: env.GITHUB_CLIENT_SECRET,
			code,
			redirect_uri: redirectUri,
		}),
	});
	if (!res.ok) throw new Error(`github token exchange failed: ${res.status}`);
	const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
	if (!data.access_token) throw new Error(`github token exchange error: ${data.error || 'no access_token'}`);
	return data.access_token;
}

interface GithubUserResponse {
	id: number;
	login: string;
	name: string | null;
	email: string | null;
	avatar_url: string | null;
}

/** Fetch the authenticated GitHub profile. */
export async function fetchGithubUser(token: string): Promise<GithubUserResponse> {
	const res = await fetch(`${GITHUB_API}/user`, {
		headers: {
			accept: 'application/vnd.github+json',
			authorization: `Bearer ${token}`,
			'user-agent': 'url-shortener',
			'x-github-api-version': '2022-11-28',
		},
	});
	if (!res.ok) throw new Error(`github user fetch failed: ${res.status}`);
	return (await res.json()) as GithubUserResponse;
}

/** Fetch the primary verified email (profile email is often null when private). */
export async function fetchPrimaryEmail(token: string): Promise<string | null> {
	const res = await fetch(`${GITHUB_API}/user/emails`, {
		headers: {
			accept: 'application/vnd.github+json',
			authorization: `Bearer ${token}`,
			'user-agent': 'url-shortener',
			'x-github-api-version': '2022-11-28',
		},
	});
	if (!res.ok) return null;
	const emails = (await res.json().catch(() => [])) as { email: string; primary: boolean; verified: boolean }[];
	const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.primary) ?? emails.find((e) => e.verified);
	return primary?.email ?? null;
}

/** URL-safe random token. */
function randomToken(bytes: number): string {
	const buf = new Uint8Array(bytes);
	crypto.getRandomValues(buf);
	return btoa(String.fromCharCode(...buf))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}
