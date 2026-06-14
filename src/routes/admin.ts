import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { fail } from '../lib/responses';
import { createLink } from '../lib/links';
import { putLink, purgeLink } from '../lib/cache';
import { shortUrl } from '../lib/url';
import { requireSession, clientMeta } from '../lib/admin-auth';
import {
	createSession,
	revokeSession,
	listSessions,
	sessionCookie,
	clearSessionCookie,
	timingSafeEqual,
	parseCookies,
	getSession,
	SESSION_COOKIE,
} from '../lib/session';

export const admin = new Hono<AppEnv>().basePath('/api/admin');

// ---------------------------------------------------------------------------
// Public: login (rate limited). Registered BEFORE requireSession so it stays open.
// ---------------------------------------------------------------------------
admin.post('/login', async (c) => {
	const limiter = c.env.LOGIN_LIMITER;
	if (limiter) {
		const key = c.req.header('cf-connecting-ip') || 'anonymous';
		if (!(await limiter.limit({ key })).success) return fail(c, 429, 'rate_limited', 'Too many attempts, try again later');
	}

	const body = (await c.req.json().catch(() => null)) as { username?: string; password?: string } | null;
	if (!body?.username || !body?.password) return fail(c, 400, 'bad_request', 'username and password are required');

	const [userOk, passOk] = await Promise.all([
		timingSafeEqual(body.username, c.env.ADMIN_USERNAME),
		timingSafeEqual(body.password, c.env.ADMIN_PASSWORD),
	]);
	if (!userOk || !passOk) return fail(c, 401, 'invalid_credentials', 'Invalid username or password');

	const meta = clientMeta(c);
	const { token, csrf } = await createSession(c.env, meta);
	c.header('Set-Cookie', sessionCookie(token));
	return c.json({ user: c.env.ADMIN_USERNAME, csrf });
});

// ---------------------------------------------------------------------------
// Everything below requires a valid session (+ CSRF header on mutations).
// ---------------------------------------------------------------------------
admin.use('*', requireSession());

admin.get('/me', (c) => c.json({ user: c.env.ADMIN_USERNAME, csrf: c.get('csrf') }));

admin.post('/logout', async (c) => {
	await revokeSession(c.env, c.get('sessionId'));
	c.header('Set-Cookie', clearSessionCookie());
	return c.json({ success: true });
});

// --- Overview / aggregate stats ---
admin.get('/overview', async (c) => {
	const [totals, series, topLinks, topCountries, topReferrers] = await c.env.DB.batch([
		c.env.DB.prepare(`
			SELECT
				(SELECT COUNT(*) FROM urls) AS links,
				(SELECT COUNT(*) FROM urls WHERE active = 1) AS active_links,
				(SELECT COUNT(*) FROM analytics) AS clicks,
				(SELECT COUNT(*) FROM analytics WHERE timestamp >= datetime('now','-1 day')) AS clicks_24h,
				(SELECT COUNT(*) FROM analytics WHERE timestamp >= datetime('now','-7 day')) AS clicks_7d
		`),
		c.env.DB.prepare(
			`SELECT date(timestamp) AS day, COUNT(*) AS clicks FROM analytics WHERE timestamp >= datetime('now','-29 day') GROUP BY day ORDER BY day`
		),
		c.env.DB.prepare(
			`SELECT a.short_id AS id, u.original_url, COUNT(*) AS clicks FROM analytics a JOIN urls u ON u.id = a.short_id GROUP BY a.short_id ORDER BY clicks DESC LIMIT 8`
		),
		c.env.DB.prepare(`SELECT country_code, COUNT(*) AS clicks FROM analytics WHERE country_code != '' GROUP BY country_code ORDER BY clicks DESC LIMIT 8`),
		c.env.DB.prepare(`SELECT referrer, COUNT(*) AS clicks FROM analytics WHERE referrer != '' GROUP BY referrer ORDER BY clicks DESC LIMIT 8`),
	]);

	return c.json({
		totals: totals.results[0],
		series: series.results,
		top_links: topLinks.results,
		top_countries: topCountries.results,
		top_referrers: topReferrers.results,
	});
});

// --- Links list (search + pagination + sort) ---
const SORT_COLUMNS: Record<string, string> = {
	clicks: 'click_count',
	created: 'u.created_at',
	last: 'last_clicked',
};

admin.get('/links', async (c) => {
	const q = (c.req.query('q') || '').trim();
	const page = Math.max(1, parseInt(c.req.query('page') || '1'));
	const limit = Math.max(1, Math.min(parseInt(c.req.query('limit') || '20'), 200));
	const sortCol = SORT_COLUMNS[c.req.query('sort') || 'created'] || 'u.created_at';
	const dir = (c.req.query('dir') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
	const offset = (page - 1) * limit;
	const like = `%${q}%`;

	const where = q ? `WHERE u.id LIKE ? OR u.original_url LIKE ?` : '';
	const whereArgs = q ? [like, like] : [];

	const [rows, total] = await c.env.DB.batch([
		c.env.DB.prepare(
			`SELECT u.id, u.original_url, u.created_at, u.expires_at, u.active,
				COUNT(a.id) AS click_count, MAX(a.timestamp) AS last_clicked
			 FROM urls u LEFT JOIN analytics a ON a.short_id = u.id
			 ${where}
			 GROUP BY u.id
			 ORDER BY ${sortCol} ${dir}
			 LIMIT ? OFFSET ?`
		).bind(...whereArgs, limit, offset),
		c.env.DB.prepare(`SELECT COUNT(*) AS total FROM urls u ${where}`).bind(...whereArgs),
	]);

	return c.json({ page, limit, total: (total.results[0] as { total: number }).total, data: rows.results });
});

// --- Create a link from the dashboard ---
admin.post('/links', async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body || typeof body !== 'object') return fail(c, 400, 'bad_request', 'Invalid JSON body');

	const result = await createLink(c.env, body);
	if (!result.ok) return fail(c, result.status, result.code, result.error);
	if (!result.existing) c.executionCtx.waitUntil(putLink(c.env, result.id, { u: result.url, e: result.expiresAt, a: true }));

	const expires_at = result.expiresAt == null ? null : new Date(result.expiresAt).toISOString();
	return c.json({ short_url: shortUrl(c, result.id), id: result.id, expires_at, existing: result.existing }, result.existing ? 200 : 201);
});

// --- Update a link (toggle active / change expiry) ---
admin.patch('/links/:id', async (c) => {
	const id = c.req.param('id');
	const existing = await c.env.DB.prepare(`SELECT id FROM urls WHERE id = ?`).bind(id).first();
	if (!existing) return fail(c, 404, 'not_found', 'Link not found');

	const body = (await c.req.json().catch(() => ({}))) as { active?: boolean; expires_at?: string | null };
	const sets: string[] = [];
	const args: unknown[] = [];

	if (typeof body.active === 'boolean') {
		sets.push('active = ?');
		args.push(body.active ? 1 : 0);
	}
	if ('expires_at' in body) {
		if (body.expires_at === null) {
			sets.push('expires_at = NULL');
		} else {
			const ms = Date.parse(String(body.expires_at));
			if (!Number.isFinite(ms)) return fail(c, 400, 'invalid_expiry', 'expires_at must be a valid date or null');
			sets.push('expires_at = ?');
			args.push(new Date(ms).toISOString());
		}
	}
	if (sets.length === 0) return fail(c, 400, 'bad_request', 'Nothing to update');

	await c.env.DB.prepare(`UPDATE urls SET ${sets.join(', ')} WHERE id = ?`).bind(...args, id).run();
	c.executionCtx.waitUntil(purgeLink(c.env, id)); // force redirect path to re-read

	const updated = await c.env.DB.prepare(`SELECT id, original_url, created_at, expires_at, active FROM urls WHERE id = ?`).bind(id).first();
	return c.json(updated);
});

// --- Delete links (+ analytics, + cache) ---
admin.delete('/links', async (c) => {
	const body = (await c.req.json().catch(() => null)) as { ids?: unknown } | null;
	const ids = body?.ids;
	if (!Array.isArray(ids) || ids.length === 0 || !ids.every((i) => typeof i === 'string')) {
		return fail(c, 400, 'bad_request', 'Body must be { ids: string[] }');
	}
	const placeholders = ids.map(() => '?').join(',');
	await c.env.DB.batch([
		c.env.DB.prepare(`DELETE FROM analytics WHERE short_id IN (${placeholders})`).bind(...ids),
		c.env.DB.prepare(`DELETE FROM urls WHERE id IN (${placeholders})`).bind(...ids),
	]);
	c.executionCtx.waitUntil(Promise.all((ids as string[]).map((id) => purgeLink(c.env, id))).then(() => undefined));
	return c.json({ success: true, ids });
});

// --- Per-link detail: records (search + pagination) + aggregates ---
admin.get('/links/:id', async (c) => {
	const id = c.req.param('id');
	const link = await c.env.DB.prepare(`SELECT id, original_url, created_at, expires_at, active FROM urls WHERE id = ?`).bind(id).first();
	if (!link) return fail(c, 404, 'not_found', 'Link not found');

	const q = (c.req.query('q') || '').trim();
	const page = Math.max(1, parseInt(c.req.query('page') || '1'));
	const limit = Math.max(1, Math.min(parseInt(c.req.query('limit') || '25'), 200));
	const offset = (page - 1) * limit;
	const like = `%${q}%`;
	const search = q ? `AND (ip LIKE ? OR user_agent LIKE ? OR country_code LIKE ? OR referrer LIKE ?)` : '';
	const searchArgs = q ? [like, like, like, like] : [];

	const [records, total, byCountry, series, byReferrer] = await c.env.DB.batch([
		c.env.DB.prepare(
			`SELECT timestamp, ip, user_agent, country_code, referrer FROM analytics WHERE short_id = ? ${search} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
		).bind(id, ...searchArgs, limit, offset),
		c.env.DB.prepare(`SELECT COUNT(*) AS total FROM analytics WHERE short_id = ? ${search}`).bind(id, ...searchArgs),
		c.env.DB.prepare(`SELECT country_code, COUNT(*) AS clicks FROM analytics WHERE short_id = ? AND country_code != '' GROUP BY country_code ORDER BY clicks DESC LIMIT 8`).bind(id),
		c.env.DB.prepare(`SELECT date(timestamp) AS day, COUNT(*) AS clicks FROM analytics WHERE short_id = ? AND timestamp >= datetime('now','-29 day') GROUP BY day ORDER BY day`).bind(id),
		c.env.DB.prepare(`SELECT referrer, COUNT(*) AS clicks FROM analytics WHERE short_id = ? AND referrer != '' GROUP BY referrer ORDER BY clicks DESC LIMIT 8`).bind(id),
	]);

	return c.json({
		link,
		short_url: shortUrl(c, id as string),
		records: records.results,
		total_records: (total.results[0] as { total: number }).total,
		page,
		limit,
		by_country: byCountry.results,
		by_referrer: byReferrer.results,
		series: series.results,
	});
});

// --- Active sessions: list + revoke ---
admin.get('/sessions', async (c) => {
	const { results } = await listSessions(c.env);
	const current = c.get('sessionId');
	return c.json({
		data: results.map((s) => ({
			id: s.id,
			ip: s.ip,
			user_agent: s.user_agent,
			country_code: s.country_code,
			created_at: s.created_at,
			last_seen: s.last_seen,
			expires_at: s.expires_at,
			current: s.id === current,
		})),
	});
});

admin.delete('/sessions/:id', async (c) => {
	const id = c.req.param('id');
	await revokeSession(c.env, id);
	// If you revoked your own session, also clear the cookie.
	if (id === c.get('sessionId')) c.header('Set-Cookie', clearSessionCookie());
	return c.json({ success: true });
});

// Re-export helpers used by tests / index if needed.
export { parseCookies, getSession, SESSION_COOKIE };
