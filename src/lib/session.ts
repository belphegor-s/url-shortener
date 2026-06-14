import type { Bindings } from '../types';

/** Cookie name. `__Host-` prefix forces Secure + Path=/ + no Domain — strongest binding. */
export const SESSION_COOKIE = '__Host-session';
/** Persistent session lifetime. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionRow {
	id: string;
	csrf: string;
	ip: string | null;
	user_agent: string | null;
	country_code: string | null;
	created_at: number;
	last_seen: number;
	expires_at: number;
}

/** URL-safe random token. */
function randomToken(bytes = 32): string {
	const buf = new Uint8Array(bytes);
	crypto.getRandomValues(buf);
	return btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Hex SHA-256 — used to store only a hash of the session token. */
export async function sha256Hex(input: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time string compare via digests. */
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
	const enc = new TextEncoder();
	const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
	const va = new Uint8Array(ha);
	const vb = new Uint8Array(hb);
	let diff = 0;
	for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
	return diff === 0;
}

export interface NewSession {
	token: string;
	id: string;
	csrf: string;
}

/** Create + persist a session. Returns the raw token (for the cookie) and csrf (for the client). */
export async function createSession(
	env: Bindings,
	meta: { ip: string; userAgent: string; country: string }
): Promise<NewSession> {
	const token = randomToken();
	const id = await sha256Hex(token);
	const csrf = randomToken(24);
	const now = Date.now();
	await env.DB.prepare(
		`INSERT INTO sessions (id, csrf, ip, user_agent, country_code, created_at, last_seen, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(id, csrf, meta.ip, meta.userAgent, meta.country, now, now, now + SESSION_TTL_MS)
		.run();
	return { token, id, csrf };
}

/** Resolve a raw cookie token to a live session, or null if missing/expired. */
export async function getSession(env: Bindings, token: string | undefined): Promise<SessionRow | null> {
	if (!token) return null;
	const id = await sha256Hex(token);
	const row = await env.DB.prepare(`SELECT * FROM sessions WHERE id = ?`).bind(id).first<SessionRow>();
	if (!row) return null;
	if (row.expires_at <= Date.now()) {
		await revokeSession(env, id);
		return null;
	}
	return row;
}

/** Bump last_seen (and refresh metadata) — call via waitUntil. */
export function touchSession(env: Bindings, id: string, meta: { ip: string; country: string }): Promise<unknown> {
	return env.DB.prepare(`UPDATE sessions SET last_seen = ?, ip = ?, country_code = ? WHERE id = ?`)
		.bind(Date.now(), meta.ip, meta.country, id)
		.run();
}

export const revokeSession = (env: Bindings, id: string): Promise<unknown> =>
	env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(id).run();

export const listSessions = (env: Bindings): Promise<{ results: SessionRow[] }> =>
	env.DB.prepare(`SELECT * FROM sessions WHERE expires_at > ? ORDER BY last_seen DESC`).bind(Date.now()).all<SessionRow>();

/** Build the Set-Cookie value for a fresh session. */
export const sessionCookie = (token: string): string =>
	`${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;

/** Build a Set-Cookie that clears the session. */
export const clearSessionCookie = (): string => `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

/** Parse a Cookie header into a map. */
export function parseCookies(header: string | undefined): Record<string, string> {
	const out: Record<string, string> = {};
	if (!header) return out;
	for (const part of header.split(';')) {
		const idx = part.indexOf('=');
		if (idx === -1) continue;
		out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
	}
	return out;
}
