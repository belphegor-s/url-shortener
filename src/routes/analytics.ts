import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, User } from '../types';
import { requireUserOrApiKey } from '../lib/guards';
import { purgeLink } from '../lib/cache';
import { fail } from '../lib/responses';
import { filterOwnedIds } from '../lib/ownership';

export const analytics = new Hono<AppEnv>();

// Programmatic analytics API. Authenticated by a per-account API key (or a session);
// every result is scoped to the key's owner. Admins may pass ?scope=all.
analytics.use('/analytics', requireUserOrApiKey());
analytics.use('/analytics/*', requireUserOrApiKey());

const me = (c: Context<AppEnv>): User => c.get('user');
const isAllScope = (c: Context<AppEnv>) => c.req.query('scope') === 'all' && me(c).role === 'admin';

/** Paginated click summary, one row per short link owned by the caller. */
analytics.get('/analytics', async (c) => {
	const all = isAllScope(c);
	const uid = me(c).id;
	const page = Math.max(1, parseInt(c.req.query('page') || '1'));
	const limit = Math.max(1, Math.min(parseInt(c.req.query('limit') || '50'), 500));
	const sort = (c.req.query('sort') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
	const offset = (page - 1) * limit;

	const totalResult = await c.env.DB.prepare(
		all
			? `SELECT COUNT(DISTINCT a.short_id) AS total FROM analytics a`
			: `SELECT COUNT(DISTINCT a.short_id) AS total FROM analytics a JOIN urls u ON u.id = a.short_id WHERE u.user_id = ?`
	)
		.bind(...(all ? [] : [uid]))
		.first<{ total: number }>();

	const result = await c.env.DB.prepare(
		`
		SELECT
		  a1.short_id,
		  u.original_url,
		  COUNT(*) AS click_count,
		  MAX(timestamp) AS last_clicked,
		  MIN(timestamp) AS first_clicked,
		  MAX(CASE WHEN timestamp = (SELECT MAX(timestamp) FROM analytics AS a2 WHERE a2.short_id = a1.short_id) THEN referrer ELSE NULL END) AS latest_referrer,
		  MAX(country_code) AS country_code
		FROM analytics AS a1
		JOIN urls AS u ON a1.short_id = u.id
		${all ? '' : 'WHERE u.user_id = ?'}
		GROUP BY a1.short_id, u.original_url
		ORDER BY last_clicked ${sort}
		LIMIT ? OFFSET ?
		`
	)
		.bind(...(all ? [] : [uid]), limit, offset)
		.all();

	return c.json({ scope: all ? 'all' : 'mine', page, limit, sort, total: totalResult?.total || 0, data: result.results });
});

/** Batch-delete links and their analytics, evicting the KV cache. */
analytics.delete('/analytics', async (c) => {
	const body = await c.req.json().catch(() => null);
	const ids = (body as { ids?: unknown })?.ids;

	if (!Array.isArray(ids) || ids.length === 0 || !ids.every((i) => typeof i === 'string')) {
		return fail(c, 400, 'bad_request', 'Body must be { ids: string[] }');
	}

	const owned = me(c).role === 'admin' ? ids : await filterOwnedIds(c.env, me(c).id, ids);
	if (owned.length === 0) return c.json({ success: true, ids: [] });

	const placeholders = owned.map(() => '?').join(',');
	await c.env.DB.batch([
		c.env.DB.prepare(`DELETE FROM analytics WHERE short_id IN (${placeholders})`).bind(...owned),
		c.env.DB.prepare(`DELETE FROM urls WHERE id IN (${placeholders})`).bind(...owned),
	]);

	c.executionCtx.waitUntil(Promise.all(owned.map((id) => purgeLink(c.env, id as string))).then(() => undefined));
	return c.json({ success: true, ids: owned });
});

/** Detailed click log for a single short link (most recent 1000). */
analytics.get('/analytics/:id', async (c) => {
	const id = c.req.param('id');

	const urlResult = await c.env.DB.prepare(`SELECT original_url, user_id FROM urls WHERE id = ?`)
		.bind(id)
		.first<{ original_url: string; user_id: string | null }>();
	if (!urlResult) return fail(c, 404, 'not_found', 'Link not found');
	if (me(c).role !== 'admin' && urlResult.user_id !== me(c).id) return fail(c, 404, 'not_found', 'Link not found');

	const result = await c.env.DB.prepare(
		`
		SELECT timestamp, ip, user_agent, referrer, country_code
		FROM analytics WHERE short_id = ?
		ORDER BY timestamp DESC
		LIMIT 1000
		`
	)
		.bind(id)
		.all();

	return c.json({
		id,
		original_url: urlResult.original_url,
		click_count: result.results.length,
		analytics: result.results,
	});
});
