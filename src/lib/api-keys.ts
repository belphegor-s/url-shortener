import type { Bindings, User } from '../types';
import { sha256Hex } from './session';
import { getUser } from './users';

/** Raw-key prefix, so keys are recognisable in logs/config. */
export const KEY_PREFIX = 'shrt_';
/** Number of leading characters (incl. prefix) stored for display. */
const DISPLAY_LEN = 13; // "shrt_" + 8 chars

export interface ApiKeyRow {
	id: string;
	user_id: string;
	name: string | null;
	prefix: string;
	created_at: number;
	last_used_at: number | null;
}

export interface ApiKeyPublic {
	id: string;
	name: string | null;
	prefix: string;
	created_at: number;
	last_used_at: number | null;
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

const toPublic = (row: ApiKeyRow): ApiKeyPublic => ({
	id: row.id,
	name: row.name,
	prefix: row.prefix,
	created_at: row.created_at,
	last_used_at: row.last_used_at,
});

/** Create a key. The raw value is returned exactly once (only its hash is persisted). */
export async function createApiKey(env: Bindings, userId: string, name: string | null): Promise<{ key: string; record: ApiKeyPublic }> {
	const raw = KEY_PREFIX + randomToken(32);
	const id = await sha256Hex(raw);
	const prefix = raw.slice(0, DISPLAY_LEN);
	const now = Date.now();
	await env.DB.prepare(`INSERT INTO api_keys (id, user_id, name, prefix, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, NULL)`)
		.bind(id, userId, name, prefix, now)
		.run();
	return { key: raw, record: { id, name, prefix, created_at: now, last_used_at: null } };
}

export async function listApiKeys(env: Bindings, userId: string): Promise<ApiKeyPublic[]> {
	const { results } = await env.DB.prepare(`SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`)
		.bind(userId)
		.all<ApiKeyRow>();
	return results.map(toPublic);
}

/** Revoke one of the caller's keys. Returns true when a row was removed. */
export async function revokeApiKey(env: Bindings, userId: string, id: string): Promise<boolean> {
	const res = await env.DB.prepare(`DELETE FROM api_keys WHERE id = ? AND user_id = ?`).bind(id, userId).run();
	return (res.meta.changes ?? 0) > 0;
}

/** Resolve a raw bearer key to its owner. Returns null when unknown or orphaned. */
export async function resolveApiKey(env: Bindings, raw: string): Promise<{ user: User; keyId: string } | null> {
	if (!raw || !raw.startsWith(KEY_PREFIX)) return null;
	const keyId = await sha256Hex(raw);
	const row = await env.DB.prepare(`SELECT user_id FROM api_keys WHERE id = ?`).bind(keyId).first<{ user_id: string }>();
	if (!row) return null;
	const user = await getUser(env, row.user_id);
	if (!user) return null;
	return { user, keyId };
}

/** Stamp last-used - call via waitUntil. */
export const touchApiKey = (env: Bindings, keyId: string): Promise<unknown> =>
	env.DB.prepare(`UPDATE api_keys SET last_used_at = ? WHERE id = ?`).bind(Date.now(), keyId).run();
