import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { requireAuth } from '../lib/auth';
import { purgeLink } from '../lib/cache';
import { fail } from '../lib/responses';

export const analytics = new Hono<AppEnv>();

// Every analytics route is guarded by the same bearer-token middleware.
analytics.use('/analytics', requireAuth());
analytics.use('/analytics/*', requireAuth());

/** Paginated click summary, one row per short link. */
analytics.get('/analytics', async (c) => {
	const page = Math.max(1, parseInt(c.req.query('page') || '1'));
	const limit = Math.max(1, Math.min(parseInt(c.req.query('limit') || '50'), 500));
	const sort = (c.req.query('sort') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
	const offset = (page - 1) * limit;

	const totalResult = await c.env.DB.prepare(`SELECT COUNT(DISTINCT short_id) AS total FROM analytics`).first<{ total: number }>();

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
		GROUP BY a1.short_id, u.original_url
		ORDER BY last_clicked ${sort}
		LIMIT ? OFFSET ?
		`
	)
		.bind(limit, offset)
		.all();

	return c.json({ page, limit, sort, total: totalResult?.total || 0, data: result.results });
});

/** Batch-delete links and their analytics, evicting the KV cache. */
analytics.delete('/analytics', async (c) => {
	const body = await c.req.json().catch(() => null);
	const ids = (body as { ids?: unknown })?.ids;

	if (!Array.isArray(ids) || ids.length === 0 || !ids.every((i) => typeof i === 'string')) {
		return fail(c, 400, 'bad_request', 'Body must be { ids: string[] }');
	}

	const placeholders = ids.map(() => '?').join(',');
	await c.env.DB.batch([
		c.env.DB.prepare(`DELETE FROM analytics WHERE short_id IN (${placeholders})`).bind(...ids),
		c.env.DB.prepare(`DELETE FROM urls WHERE id IN (${placeholders})`).bind(...ids),
	]);

	// Evict cache so freed short-codes stop resolving from KV.
	c.executionCtx.waitUntil(Promise.all(ids.map((id) => purgeLink(c.env, id as string))).then(() => undefined));

	return c.json({ success: true, ids });
});

/** Detailed click log for a single short link (most recent 1000). */
analytics.get('/analytics/:id', async (c) => {
	const id = c.req.param('id');

	const urlResult = await c.env.DB.prepare(`SELECT original_url FROM urls WHERE id = ?`).bind(id).first<{ original_url: string }>();

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
		original_url: urlResult?.original_url || null,
		click_count: result.results.length,
		analytics: result.results,
	});
});
