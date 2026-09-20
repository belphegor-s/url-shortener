import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';
import { seedUser } from './helpers';

const ORIGIN = 'https://short.test';

async function call(path: string, init: RequestInit = {}) {
	const ctx = createExecutionContext();
	const res = await worker.fetch(new Request(`${ORIGIN}${path}`, init), env, ctx);
	await waitOnExecutionContext(ctx);
	return res;
}

const json = (body: unknown, extra: Record<string, string> = {}) => ({
	method: 'POST',
	headers: { 'content-type': 'application/json', ...extra } as Record<string, string>,
	body: JSON.stringify(body),
});

describe('dashboard API auth', () => {
	it('rejects unauthenticated requests', async () => {
		expect((await call('/api/me')).status).toBe(401);
		expect((await call('/api/overview')).status).toBe(401);
	});

	it('returns the user + csrf for a valid session', async () => {
		const u = await seedUser();
		const res = await call('/api/me', { headers: { cookie: u.cookie } });
		expect(res.status).toBe(200);
		const body = (await res.json()) as { user: { id: string; login: string }; csrf: string };
		expect(body.user.id).toBe(u.id);
		expect(body.user.login).toBe(u.login);
		expect(body.csrf).toBe(u.csrf);
	});

	it('enforces CSRF on mutations', async () => {
		const u = await seedUser();
		const noToken = await call('/api/links', json({ url: 'https://example.com/a' }, { cookie: u.cookie }));
		expect(noToken.status).toBe(403);

		const ok = await call('/api/links', json({ url: 'https://example.com/a' }, { cookie: u.cookie, 'x-csrf-token': u.csrf }));
		expect(ok.status).toBe(201);
	});
});

describe('link ownership', () => {
	it('scopes links to their owner', async () => {
		const owner = await seedUser();
		const other = await seedUser();

		const created = (await (
			await call('/api/links', json({ url: 'https://example.com/private' }, { cookie: owner.cookie, 'x-csrf-token': owner.csrf }))
		).json()) as { id: string };

		const ownerList = (await (await call('/api/links', { headers: { cookie: owner.cookie } })).json()) as { data: { id: string }[] };
		expect(ownerList.data.some((l) => l.id === created.id)).toBe(true);

		const otherList = (await (await call('/api/links', { headers: { cookie: other.cookie } })).json()) as { data: { id: string }[] };
		expect(otherList.data.some((l) => l.id === created.id)).toBe(false);

		// Reading someone else's link 404s (not 403 - avoid leaking existence).
		expect((await call(`/api/links/${created.id}`, { headers: { cookie: other.cookie } })).status).toBe(404);
	});

	it('lets an admin view all links and users', async () => {
		const admin = await seedUser('admin');
		const user = await seedUser();
		await call('/api/links', json({ url: 'https://example.com/admin-see' }, { cookie: user.cookie, 'x-csrf-token': user.csrf }));

		const all = (await (await call('/api/links?scope=all', { headers: { cookie: admin.cookie } })).json()) as { scope: string; data: unknown[] };
		expect(all.scope).toBe('all');
		expect(all.data.length).toBeGreaterThan(0);

		expect((await call('/api/users', { headers: { cookie: admin.cookie } })).status).toBe(200);
		// A regular user cannot list users.
		expect((await call('/api/users', { headers: { cookie: user.cookie } })).status).toBe(403);
	});
});

describe('overview scopes', () => {
	it('returns owner-scoped totals, series and breakdowns', async () => {
		const u = await seedUser();
		await call('/api/links', json({ url: 'https://example.com/overview-mine' }, { cookie: u.cookie, 'x-csrf-token': u.csrf }));

		const res = await call('/api/overview', { headers: { cookie: u.cookie } });
		expect(res.status).toBe(200);
		const body = (await res.json()) as { scope: string; totals: { links: number }; series: unknown[]; top_links: unknown[] };
		expect(body.scope).toBe('mine');
		expect(body.totals.links).toBeGreaterThan(0);
		expect(Array.isArray(body.series)).toBe(true);
	});

	// The platform-wide branch drops the join it used to borrow its WHERE keyword from,
	// so every sub-query has to carry its own. Regression guard for a 500 on ?scope=all.
	it('returns platform-wide data for an admin', async () => {
		const admin = await seedUser('admin');
		const other = await seedUser();
		await call('/api/links', json({ url: 'https://example.com/overview-all' }, { cookie: other.cookie, 'x-csrf-token': other.csrf }));

		const res = await call('/api/overview?scope=all', { headers: { cookie: admin.cookie } });
		expect(res.status).toBe(200);
		const body = (await res.json()) as { scope: string; totals: { links: number }; series: unknown[] };
		expect(body.scope).toBe('all');
		expect(body.totals.links).toBeGreaterThan(0);
		expect(Array.isArray(body.series)).toBe(true);
	});

	it('ignores ?scope=all for a non-admin', async () => {
		const u = await seedUser();
		const res = await call('/api/overview?scope=all', { headers: { cookie: u.cookie } });
		expect(res.status).toBe(200);
		expect(((await res.json()) as { scope: string }).scope).toBe('mine');
	});
});

describe('API keys', () => {
	it('creates, lists, revokes, and works end-to-end', async () => {
		const u = await seedUser();
		const created = (await (
			await call('/api/keys', json({ name: 'CI' }, { cookie: u.cookie, 'x-csrf-token': u.csrf }))
		).json()) as { id: string; key: string; prefix: string };
		expect(created.key.startsWith('shrt_')).toBe(true);
		expect(created.prefix).toBe(created.key.slice(0, created.prefix.length));

		const list = (await (await call('/api/keys', { headers: { cookie: u.cookie } })).json()) as { data: { id: string; prefix: string }[] };
		expect(list.data.some((k) => k.id === created.id)).toBe(true);

		// The freshly minted key authenticates the programmatic API.
		const ctx = createExecutionContext();
		const res = await worker.fetch(
			new Request(`${ORIGIN}/create`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', authorization: `Bearer ${created.key}` },
				body: JSON.stringify({ url: 'https://example.com/from-key' }),
			}),
			env,
			ctx
		);
		await waitOnExecutionContext(ctx);
		expect(res.status).toBe(201);

		const revoke = await call(`/api/keys/${created.id}`, { method: 'DELETE', headers: { cookie: u.cookie, 'x-csrf-token': u.csrf } });
		expect(revoke.status).toBe(200);
		expect((await call('/analytics', { authorization: `Bearer ${created.key}` })).status).toBe(401);
	});
});

describe('sessions', () => {
	it('lists and revokes the current session', async () => {
		const u = await seedUser();
		const list = (await (await call('/api/sessions', { headers: { cookie: u.cookie } })).json()) as { data: { id: string; current: boolean }[] };
		const current = list.data.find((s) => s.current);
		expect(current).toBeTruthy();

		const del = await call(`/api/sessions/${current!.id}`, { method: 'DELETE', headers: { cookie: u.cookie, 'x-csrf-token': u.csrf } });
		expect(del.status).toBe(200);
		expect((await call('/api/me', { headers: { cookie: u.cookie } })).status).toBe(401);
	});

	it('logs out and invalidates the session', async () => {
		const u = await seedUser();
		const out = await call('/api/logout', { method: 'POST', headers: { cookie: u.cookie, 'x-csrf-token': u.csrf } });
		expect(out.status).toBe(200);
		expect((await call('/api/me', { headers: { cookie: u.cookie } })).status).toBe(401);
	});
});
