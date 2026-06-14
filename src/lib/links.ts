import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Bindings } from '../types';
import { nanoid, isValidCustomId } from './id';
import { isValidUrl, resolveExpiry } from './validation';

const MAX_ID_RETRIES = 5;

export interface CreateInput {
	url?: unknown;
	custom_id?: unknown;
	expires_in?: unknown;
	expires_at?: unknown;
}

export type CreateResult =
	| { ok: true; id: string; url: string; existing: boolean; expiresAt: number | null }
	| { ok: false; status: ContentfulStatusCode; code: string; error: string };

const isConstraintError = (err: unknown): boolean => /UNIQUE|constraint/i.test(String(err));

/**
 * Shared link-creation logic: validation, dedup, expiry, collision-safe insert.
 * Pure of HTTP concerns so both the public POST /create route and the admin API can reuse it.
 * Callers should warm KV with the returned {id, url, expiresAt} via waitUntil.
 */
export async function createLink(env: Bindings, input: CreateInput): Promise<CreateResult> {
	const url = input.url;
	if (typeof url !== 'string' || !isValidUrl(url)) {
		return { ok: false, status: 400, code: 'invalid_url', error: 'Missing or invalid url (must be http/https)' };
	}

	const expiresAt = resolveExpiry(input);
	if (expiresAt === undefined) {
		return { ok: false, status: 400, code: 'invalid_expiry', error: 'expires_in / expires_at is invalid or in the past' };
	}
	const expiresIso = expiresAt == null ? null : new Date(expiresAt).toISOString();

	// Custom id: validate + explicit collision check.
	if (input.custom_id != null) {
		const customId = input.custom_id;
		if (typeof customId !== 'string' || !isValidCustomId(customId)) {
			return { ok: false, status: 400, code: 'invalid_custom_id', error: 'custom_id must be 1-64 chars [a-zA-Z0-9_-] and not reserved' };
		}
		const exists = await env.DB.prepare(`SELECT 1 FROM urls WHERE id = ?`).bind(customId).first();
		if (exists) return { ok: false, status: 409, code: 'custom_id_taken', error: 'Custom ID already in use' };

		await insert(env, customId, url, expiresIso);
		return { ok: true, id: customId, url, existing: false, expiresAt };
	}

	// Auto id: dedup, then collision-safe insert.
	const dup = await env.DB.prepare(`SELECT id FROM urls WHERE original_url = ?`).bind(url).first<{ id: string }>();
	if (dup) return { ok: true, id: dup.id, url, existing: true, expiresAt: null };

	for (let attempt = 0; attempt < MAX_ID_RETRIES; attempt++) {
		const id = nanoid();
		try {
			await insert(env, id, url, expiresIso);
			return { ok: true, id, url, existing: false, expiresAt };
		} catch (err) {
			if (isConstraintError(err)) continue;
			console.error('insert failed', String(err));
			return { ok: false, status: 500, code: 'internal_error', error: 'Failed to create short URL' };
		}
	}
	return { ok: false, status: 500, code: 'id_exhausted', error: 'Could not allocate a unique id, please retry' };
}

const insert = (env: Bindings, id: string, url: string, expiresIso: string | null) =>
	env.DB.prepare(`INSERT INTO urls (id, original_url, expires_at, active) VALUES (?, ?, ?, 1)`).bind(id, url, expiresIso).run();
