import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, CachedLink } from '../types';
import { getLink, putLink, purgeLink } from '../lib/cache';

export const redirect = new Hono<AppEnv>();

/**
 * Hot path: short-code -> 302.
 *
 * 1. KV read-through — warm hits never touch D1.
 * 2. D1 fallback on miss, then warm KV (non-blocking).
 * 3. Expiry / active gate -> 410 Gone.
 * 4. Analytics write deferred via waitUntil — redirect returns immediately.
 */
redirect.get('/:id', async (c) => {
	const id = c.req.param('id');
	const env = c.env;

	let link = await getLink(env, id);

	if (!link) {
		const row = await env.DB.prepare(`SELECT original_url, expires_at, active FROM urls WHERE id = ?`)
			.bind(id)
			.first<{ original_url: string; expires_at: string | number | null; active: number }>();

		if (!row) return c.text('Not found', 404);

		link = {
			u: row.original_url,
			e: row.expires_at == null ? null : new Date(row.expires_at).getTime(),
			a: row.active !== 0,
		};
		c.executionCtx.waitUntil(putLink(env, id, link));
	}

	if (!isLive(link)) {
		c.executionCtx.waitUntil(purgeLink(env, id));
		return c.text('This link has expired', 410);
	}

	// Fire-and-forget the click record so the user is redirected without waiting on a D1 write.
	c.executionCtx.waitUntil(recordClick(c, id));

	c.header('Cache-Control', 'no-store');
	return c.redirect(link.u, 302);
});

const isLive = (link: CachedLink): boolean => link.a && (link.e == null || link.e > Date.now());

function recordClick(c: Context<AppEnv>, id: string): Promise<unknown> {
	return c.env.DB.prepare(`INSERT INTO analytics (short_id, ip, user_agent, country_code, referrer) VALUES (?, ?, ?, ?, ?)`)
		.bind(
			id,
			c.req.header('cf-connecting-ip') || '',
			c.req.header('user-agent') || '',
			c.req.header('cf-ipcountry') || '',
			c.req.header('referer') || ''
		)
		.run()
		.catch((err) => console.error('analytics insert failed', { id, err: String(err) }));
}
