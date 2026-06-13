import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../types';
import { nanoid, isValidCustomId } from '../lib/id';
import { isValidUrl, resolveExpiry } from '../lib/validation';
import { putLink } from '../lib/cache';
import { fail } from '../lib/responses';

export const create = new Hono<AppEnv>();

const MAX_ID_RETRIES = 5;

/** Build the absolute short URL, preferring the configured public domain. */
function shortUrl(c: Context<AppEnv>, id: string): string {
	const base = c.env.SHORT_DOMAIN || new URL(c.req.url).origin;
	return `${base.replace(/\/$/, '')}/${id}`;
}

/** Detect a UNIQUE / PRIMARY KEY constraint violation from D1. */
const isConstraintError = (err: unknown): boolean => /UNIQUE|constraint/i.test(String(err));

create.post('/create', async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body || typeof body !== 'object') return fail(c, 400, 'bad_request', 'Invalid JSON body');

	const { url, custom_id } = body as { url?: string; custom_id?: string };

	if (!url || !isValidUrl(url)) return fail(c, 400, 'invalid_url', 'Missing or invalid url (must be http/https)');

	const expiresAt = resolveExpiry(body);
	if (expiresAt === undefined) return fail(c, 400, 'invalid_expiry', 'expires_in / expires_at is invalid or in the past');

	const expiresIso = expiresAt == null ? null : new Date(expiresAt).toISOString();

	// --- Custom id path: validate + reject collisions explicitly. ---
	if (custom_id != null) {
		if (!isValidCustomId(custom_id)) {
			return fail(c, 400, 'invalid_custom_id', 'custom_id must be 1-64 chars [a-zA-Z0-9_-] and not a reserved word');
		}
		const exists = await c.env.DB.prepare(`SELECT 1 FROM urls WHERE id = ?`).bind(custom_id).first();
		if (exists) return fail(c, 409, 'custom_id_taken', 'Custom ID already in use');

		await insertUrl(c, custom_id, url, expiresIso);
		c.executionCtx.waitUntil(putLink(c.env, custom_id, { u: url, e: expiresAt, a: true }));
		return c.json({ short_url: shortUrl(c, custom_id), id: custom_id, expires_at: expiresIso, existing: false }, 201);
	}

	// --- Auto id path: dedup, then collision-safe insert with retry. ---
	const dup = await c.env.DB.prepare(`SELECT id FROM urls WHERE original_url = ?`).bind(url).first<{ id: string }>();
	if (dup) {
		return c.json({ short_url: shortUrl(c, dup.id), id: dup.id, existing: true });
	}

	for (let attempt = 0; attempt < MAX_ID_RETRIES; attempt++) {
		const id = nanoid();
		try {
			await insertUrl(c, id, url, expiresIso);
			c.executionCtx.waitUntil(putLink(c.env, id, { u: url, e: expiresAt, a: true }));
			return c.json({ short_url: shortUrl(c, id), id, expires_at: expiresIso, existing: false }, 201);
		} catch (err) {
			if (isConstraintError(err)) continue; // generated id collided — try a fresh one
			console.error('insert failed', String(err));
			return fail(c, 500, 'internal_error', 'Failed to create short URL');
		}
	}

	return fail(c, 500, 'id_exhausted', 'Could not allocate a unique id, please retry');
});

const insertUrl = (c: Context<AppEnv>, id: string, url: string, expiresIso: string | null) =>
	c.env.DB.prepare(`INSERT INTO urls (id, original_url, expires_at, active) VALUES (?, ?, ?, 1)`).bind(id, url, expiresIso).run();
