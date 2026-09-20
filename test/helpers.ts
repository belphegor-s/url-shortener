import { env } from 'cloudflare:test';
import { sha256Hex } from '../src/lib/session';
import { createApiKey } from '../src/lib/api-keys';

export interface SeededUser {
	id: string;
	login: string;
	cookie: string;
	csrf: string;
	role: 'user' | 'admin';
}

let counter = 0;

/**
 * Insert a user + a live session directly into D1 and return the cookie/CSRF needed to
 * exercise authenticated routes (bypasses the GitHub OAuth round-trip).
 */
export async function seedUser(role: 'user' | 'admin' = 'user'): Promise<SeededUser> {
	counter += 1;
	const id = crypto.randomUUID();
	const login = `user${counter}-${Date.now()}`;
	const githubId = String(Date.now()) + String(counter);
	const now = Date.now();
	await env.DB.prepare(
		`INSERT INTO users (id, github_id, login, name, email, avatar_url, role, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(id, githubId, login, `Test ${counter}`, `${login}@example.com`, null, role, now, now)
		.run();

	const token = `token-${crypto.randomUUID()}`;
	const sid = await sha256Hex(token);
	const csrf = `csrf-${crypto.randomUUID()}`;
	await env.DB.prepare(
		`INSERT INTO sessions (id, csrf, user_id, ip, user_agent, country_code, created_at, last_seen, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(sid, csrf, id, '127.0.0.1', 'vitest', 'US', now, now, now + 86_400_000)
		.run();

	return { id, login, cookie: `__Host-session=${token}`, csrf, role };
}

/** Mint a per-account API key for a seeded user and return the raw bearer value. */
export async function seedApiKey(userId: string, name = 'test key'): Promise<string> {
	const { key } = await createApiKey(env, userId, name);
	return key;
}
