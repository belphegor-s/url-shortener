import type { Bindings, User, UserRow } from '../types';

/** Map a DB row to the public user shape (drops columns we never expose). */
export const toUser = (row: UserRow): User => ({
	id: row.id,
	githubId: row.github_id,
	login: row.login,
	name: row.name,
	email: row.email,
	avatarUrl: row.avatar_url,
	role: row.role === 'admin' ? 'admin' : 'user',
});

/** Case-insensitive, comma-separated allow-list membership. */
function listed(value: string | null | undefined, list: string | undefined): boolean {
	if (!value || !list) return false;
	const needle = value.trim().toLowerCase();
	return list
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean)
		.includes(needle);
}

/**
 * Resolve the role for a sign-in.
 * - Platform admins are designated via ADMIN_GITHUB_LOGIN / ADMIN_GITHUB_EMAIL.
 * - An existing admin role is never downgraded by a later sign-in (prevents lock-out
 *   if the allow-list env is ever removed by accident).
 */
export function resolveRole(env: Bindings, existing: UserRow | null, github: { login: string; email?: string | null }): 'user' | 'admin' {
	if (existing?.role === 'admin') return 'admin';
	if (listed(github.login, env.ADMIN_GITHUB_LOGIN)) return 'admin';
	if (listed(github.email, env.ADMIN_GITHUB_EMAIL)) return 'admin';
	return 'user';
}

export interface GithubProfile {
	id: string | number;
	login: string;
	name?: string | null;
	email?: string | null;
	avatar_url?: string | null;
}

/** Upsert a user from a GitHub profile, returning the canonical user. */
export async function upsertUser(env: Bindings, profile: GithubProfile, email: string | null): Promise<User> {
	const githubId = String(profile.id);
	const existing = await env.DB.prepare(`SELECT * FROM users WHERE github_id = ?`).bind(githubId).first<UserRow>();
	const role = resolveRole(env, existing, { login: profile.login, email });
	const now = Date.now();

	if (existing) {
		await env.DB.prepare(`UPDATE users SET login = ?, name = ?, email = ?, avatar_url = ?, role = ?, last_login = ? WHERE github_id = ?`)
			.bind(profile.login, profile.name ?? null, email, profile.avatar_url ?? null, role, now, githubId)
			.run();
		return toUser({ ...existing, login: profile.login, name: profile.name ?? null, email, avatar_url: profile.avatar_url ?? null, role, last_login: now });
	}

	const id = crypto.randomUUID();
	await env.DB.prepare(
		`INSERT INTO users (id, github_id, login, name, email, avatar_url, role, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(id, githubId, profile.login, profile.name ?? null, email, profile.avatar_url ?? null, role, now, now)
		.run();

	return { id, githubId, login: profile.login, name: profile.name ?? null, email, avatarUrl: profile.avatar_url ?? null, role };
}

/** Load a user by internal id. Returns null for unknown/deleted users. */
export async function getUser(env: Bindings, id: string): Promise<User | null> {
	const row = await env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first<UserRow>();
	return row ? toUser(row) : null;
}

/** Platform-wide user list (admin only) with per-user link + click counts. */
export async function listUsers(env: Bindings) {
	return env.DB.prepare(
		`SELECT u.id, u.github_id, u.login, u.name, u.email, u.avatar_url, u.role, u.created_at, u.last_login,
			(SELECT COUNT(*) FROM urls x WHERE x.user_id = u.id) AS links,
			(SELECT COUNT(*) FROM urls x WHERE x.user_id = u.id AND x.active = 1) AS active_links,
			(SELECT COUNT(*) FROM analytics a JOIN urls x ON x.id = a.short_id WHERE x.user_id = u.id) AS clicks
		 FROM users u
		 ORDER BY u.last_login DESC`
	).all();
}
