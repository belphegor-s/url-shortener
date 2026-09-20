import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { createLink } from '../lib/links';
import { putLink } from '../lib/cache';
import { shortUrl } from '../lib/url';
import { fail } from '../lib/responses';
import { requireUserOrApiKey } from '../lib/guards';

export const create = new Hono<AppEnv>();

/**
 * Programmatic create endpoint. Requires either a logged-in session or the bearer API
 * key (server-to-server). Session-created links are owned by that user; API-key links
 * are unowned.
 */
create.post('/create', requireUserOrApiKey(), async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body || typeof body !== 'object') return fail(c, 400, 'bad_request', 'Invalid JSON body');

	const result = await createLink(c.env, body, c.get('user').id);
	if (!result.ok) return fail(c, result.status, result.code, result.error);

	// Warm the redirect cache out of band.
	if (!result.existing) {
		c.executionCtx.waitUntil(putLink(c.env, result.id, { u: result.url, e: result.expiresAt, a: true }));
	}

	const expires_at = result.expiresAt == null ? null : new Date(result.expiresAt).toISOString();
	return c.json(
		{ short_url: shortUrl(c, result.id), id: result.id, expires_at, existing: result.existing },
		result.existing ? 200 : 201
	);
});
