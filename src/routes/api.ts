import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, User } from '../types';
import { fail } from '../lib/responses';
import { createLink } from '../lib/links';
import { putLink, purgeLink } from '../lib/cache';
import { shortUrl } from '../lib/url';
import { requireUser, requireAdmin } from '../lib/guards';
import { listUsers } from '../lib/users';
import { revokeSession, listSessions, clearSessionCookie } from '../lib/session';
import { createApiKey, listApiKeys, revokeApiKey } from '../lib/api-keys';
import { filterOwnedIds } from '../lib/ownership';

export const api = new Hono<AppEnv>().basePath('/api');

// Every endpoint below requires a logged-in user.
api.use('*', requireUser());

/** True when the caller is a platform admin viewing the whole platform. */
const isAllScope = (c: Context<AppEnv>) => c.req.query('scope') === 'all' && c.get('user')?.role === 'admin';
const me = (c: Context<AppEnv>): User => c.get('user')!;

/** A link is accessible to its owner, or to any admin. */
async function canAccess(c: Context<AppEnv>, id: string): Promise<boolean> {
	const row = await c.env.DB.prepare(`SELECT user_id FROM urls WHERE id = ?`).bind(id).first<{ user_id: string | null }>();
	if (!row) return false;
	return me(c).role === 'admin' || row.user_id === me(c).id;
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------
api.get('/me', (c) => c.json({ user: me(c), csrf: c.get('csrf') }));

api.post('/logout', async (c) => {
	await revokeSession(c.env, c.get('sessionId'));
	c.header('Set-Cookie', clearSessionCookie());
	return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Overview / aggregate stats (owner-scoped; admins may pass ?scope=all)
// ---------------------------------------------------------------------------
api.get('/overview', async (c) => {
	const all = isAllScope(c);
	const uid = me(c).id;

	const totalsSql = all
		? `SELECT
			(SELECT COUNT(*) FROM urls) AS links,
			(SELECT COUNT(*) FROM urls WHERE active = 1) AS active_links,
			(SELECT COUNT(*) FROM analytics) AS clicks,
			(SELECT COUNT(*) FROM analytics WHERE timestamp >= datetime('now','-1 day')) AS clicks_24h,
			(SELECT COUNT(*) FROM analytics WHERE timestamp >= datetime('now','-7 day')) AS clicks_7d`
		: `SELECT
			(SELECT COUNT(*) FROM urls WHERE user_id = ?) AS links,
			(SELECT COUNT(*) FROM urls WHERE user_id = ? AND active = 1) AS active_links,
			(SELECT COUNT(*) FROM analytics a JOIN urls u ON u.id = a.short_id WHERE u.user_id = ?) AS clicks,
			(SELECT COUNT(*) FROM analytics a JOIN urls u ON u.id = a.short_id WHERE u.user_id = ? AND a.timestamp >= datetime('now','-1 day')) AS clicks_24h,
			(SELECT COUNT(*) FROM analytics a JOIN urls u ON u.id = a.short_id WHERE u.user_id = ? AND a.timestamp >= datetime('now','-7 day')) AS clicks_7d`;
	const ifUid = (n: number) => (all ? [] : Array(n).fill(uid));

	const [totals, series, topLinks, topCountries, topReferrers] = await c.env.DB.batch([
		c.env.DB.prepare(totalsSql).bind(...ifUid(5)),
		c.env.DB.prepare(
			// The owner-scoped variant needs the join to reach `urls.user_id`; the platform
			// variant still needs its own WHERE, so the keyword lives inside both branches.
			`SELECT date(a.timestamp) AS day, COUNT(*) AS clicks FROM analytics a ${all ? 'WHERE' : 'JOIN urls u ON u.id = a.short_id WHERE u.user_id = ? AND'} a.timestamp >= datetime('now','-29 day') GROUP BY day ORDER BY day`
		).bind(...ifUid(1)),
		c.env.DB.prepare(
			`SELECT a.short_id AS id, u.original_url, COUNT(*) AS clicks FROM analytics a JOIN urls u ON u.id = a.short_id ${all ? '' : 'WHERE u.user_id = ?'} GROUP BY a.short_id ORDER BY clicks DESC LIMIT 8`
		).bind(...ifUid(1)),
		c.env.DB.prepare(
			`SELECT a.country_code, COUNT(*) AS clicks FROM analytics a JOIN urls u ON u.id = a.short_id WHERE a.country_code != '' ${all ? '' : 'AND u.user_id = ?'} GROUP BY a.country_code ORDER BY clicks DESC LIMIT 8`
		).bind(...ifUid(1)),
		c.env.DB.prepare(
			`SELECT a.referrer, COUNT(*) AS clicks FROM analytics a JOIN urls u ON u.id = a.short_id WHERE a.referrer != '' ${all ? '' : 'AND u.user_id = ?'} GROUP BY a.referrer ORDER BY clicks DESC LIMIT 8`
		).bind(...ifUid(1)),
	]);

	return c.json({
		scope: all ? 'all' : 'mine',
		totals: totals.results[0],
		series: series.results,
		top_links: topLinks.results,
		top_countries: topCountries.results,
		top_referrers: topReferrers.results,
	});
});

// ---------------------------------------------------------------------------
// Links (search + pagination + sort)
// ---------------------------------------------------------------------------
const SORT_COLUMNS: Record<string, string> = {
	clicks: 'click_count',
	created: 'u.created_at',
	last: 'last_clicked',
};

api.get('/links', async (c) => {
	const all = isAllScope(c);
	const uid = me(c).id;
	const q = (c.req.query('q') || '').trim();
	const page = Math.max(1, parseInt(c.req.query('page') || '1'));
	const limit = Math.max(1, Math.min(parseInt(c.req.query('limit') || '20'), 200));
	const sortCol = SORT_COLUMNS[c.req.query('sort') || 'created'] || 'u.created_at';
	const dir = (c.req.query('dir') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
	const offset = (page - 1) * limit;
	const like = `%${q}%`;

	const clauses: string[] = [];
	const args: unknown[] = [];
	if (!all) {
		clauses.push('u.user_id = ?');
		args.push(uid);
	}
	if (q) {
		clauses.push('(u.id LIKE ? OR u.original_url LIKE ?)');
		args.push(like, like);
	}
	const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

	const [rows, total] = await c.env.DB.batch([
		c.env.DB.prepare(
			`SELECT u.id, u.original_url, u.created_at, u.expires_at, u.active, u.user_id,
				COUNT(a.id) AS click_count, MAX(a.timestamp) AS last_clicked
			 FROM urls u LEFT JOIN analytics a ON a.short_id = u.id
			 ${where}
			 GROUP BY u.id
			 ORDER BY ${sortCol} ${dir}
			 LIMIT ? OFFSET ?`
		).bind(...args, limit, offset),
		c.env.DB.prepare(`SELECT COUNT(*) AS total FROM urls u ${where}`).bind(...args),
	]);

	const data = (rows.results as { id: string }[]).map((row) => ({ ...row, short_url: shortUrl(c, row.id) }));
	return c.json({ scope: all ? 'all' : 'mine', page, limit, total: (total.results[0] as { total: number }).total, data });
});

// ---------------------------------------------------------------------------
// Create a link from the dashboard
// ---------------------------------------------------------------------------
api.post('/links', async (c) => {
	const body = await c.req.json().catch(() => null);
	if (!body || typeof body !== 'object') return fail(c, 400, 'bad_request', 'Invalid JSON body');

	const result = await createLink(c.env, body, me(c).id);
	if (!result.ok) return fail(c, result.status, result.code, result.error);
	if (!result.existing) c.executionCtx.waitUntil(putLink(c.env, result.id, { u: result.url, e: result.expiresAt, a: true }));

	const expires_at = result.expiresAt == null ? null : new Date(result.expiresAt).toISOString();
	return c.json({ short_url: shortUrl(c, result.id), id: result.id, expires_at, existing: result.existing }, result.existing ? 200 : 201);
});

// ---------------------------------------------------------------------------
// Update a link (toggle active / change expiry)
// ---------------------------------------------------------------------------
api.patch('/links/:id', async (c) => {
	const id = c.req.param('id');
	if (!(await canAccess(c, id))) return fail(c, 404, 'not_found', 'Link not found');

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

// ---------------------------------------------------------------------------
// Delete links (+ analytics, + cache). Owners may only delete their own.
// ---------------------------------------------------------------------------
api.delete('/links', async (c) => {
	const body = (await c.req.json().catch(() => null)) as { ids?: unknown } | null;
	const ids = body?.ids;
	if (!Array.isArray(ids) || ids.length === 0 || !ids.every((i) => typeof i === 'string')) {
		return fail(c, 400, 'bad_request', 'Body must be { ids: string[] }');
	}

	const owned = me(c).role === 'admin' ? (ids as string[]) : await filterOwnedIds(c.env, me(c).id, ids as string[]);
	if (owned.length === 0) return c.json({ success: true, ids: [] });

	const placeholders = owned.map(() => '?').join(',');
	await c.env.DB.batch([
		c.env.DB.prepare(`DELETE FROM analytics WHERE short_id IN (${placeholders})`).bind(...owned),
		c.env.DB.prepare(`DELETE FROM urls WHERE id IN (${placeholders})`).bind(...owned),
	]);
	c.executionCtx.waitUntil(Promise.all(owned.map((id) => purgeLink(c.env, id))).then(() => undefined));
	return c.json({ success: true, ids: owned });
});

// ---------------------------------------------------------------------------
// Per-link detail: records + aggregates
// ---------------------------------------------------------------------------
api.get('/links/:id', async (c) => {
	const id = c.req.param('id');
	const link = await c.env.DB.prepare(`SELECT id, original_url, created_at, expires_at, active, user_id FROM urls WHERE id = ?`)
		.bind(id)
		.first<{ id: string; original_url: string; created_at: string; expires_at: string | null; active: number; user_id: string | null }>();
	if (!link) return fail(c, 404, 'not_found', 'Link not found');
	if (me(c).role !== 'admin' && link.user_id !== me(c).id) return fail(c, 404, 'not_found', 'Link not found');

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

// ---------------------------------------------------------------------------
// Active sessions: list + revoke (own sessions only)
// ---------------------------------------------------------------------------
api.get('/sessions', async (c) => {
	const { results } = await listSessions(c.env, me(c).id);
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

api.delete('/sessions/:id', async (c) => {
	const id = c.req.param('id');
	const row = await c.env.DB.prepare(`SELECT user_id FROM sessions WHERE id = ?`).bind(id).first<{ user_id: string | null }>();
	if (!row || (row.user_id !== me(c).id && me(c).role !== 'admin')) return fail(c, 404, 'not_found', 'Session not found');
	await revokeSession(c.env, id);
	if (id === c.get('sessionId')) c.header('Set-Cookie', clearSessionCookie());
	return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// API keys: per-account programmatic access
// ---------------------------------------------------------------------------
api.get('/keys', async (c) => c.json({ data: await listApiKeys(c.env, me(c).id) }));

api.post('/keys', async (c) => {
	const body = (await c.req.json().catch(() => ({}))) as { name?: unknown };
	const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 60) : null;
	const { key, record } = await createApiKey(c.env, me(c).id, name);
	// The raw key is shown exactly once; only its hash is stored.
	return c.json({ key, ...record }, 201);
});

api.delete('/keys/:id', async (c) => {
	const ok = await revokeApiKey(c.env, me(c).id, c.req.param('id'));
	if (!ok) return fail(c, 404, 'not_found', 'API key not found');
	return c.json({ success: true });
});

// ---------------------------------------------------------------------------
// Admin: platform users
// ---------------------------------------------------------------------------
api.get('/users', requireAdmin(), async (c) => {
	const { results } = await listUsers(c.env);
	return c.json({ data: results });
});
