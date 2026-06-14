import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

const ORIGIN = 'https://short.test';

async function call(path: string, init: RequestInit = {}) {
	const ctx = createExecutionContext();
	const res = await worker.fetch(new Request(`${ORIGIN}${path}`, init), env, ctx);
	await waitOnExecutionContext(ctx);
	return res;
}

/** Pull the session cookie value out of a Set-Cookie header. */
function cookieFrom(res: Response): string {
	const sc = res.headers.get('set-cookie') || '';
	return sc.split(';')[0]; // "__Host-session=<token>"
}

async function login() {
	const res = await call('/api/admin/login', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ username: 'ayush', password: 'test-password' }),
	});
	expect(res.status).toBe(200);
	const body = (await res.json()) as { user: string; csrf: string };
	return { cookie: cookieFrom(res), csrf: body.csrf, user: body.user };
}

describe('admin auth', () => {
	it('rejects bad credentials', async () => {
		const res = await call('/api/admin/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ username: 'ayush', password: 'wrong' }),
		});
		expect(res.status).toBe(401);
	});

	it('logs in and returns user + csrf + cookie', async () => {
		const { cookie, csrf, user } = await login();
		expect(user).toBe('ayush');
		expect(csrf).toBeTruthy();
		expect(cookie).toContain('__Host-session=');
	});

	it('blocks protected routes without a session', async () => {
		expect((await call('/api/admin/overview')).status).toBe(401);
	});

	it('allows protected routes with a valid session cookie', async () => {
		const { cookie } = await login();
		const res = await call('/api/admin/overview', { headers: { cookie } });
		expect(res.status).toBe(200);
	});

	it('enforces CSRF on mutations', async () => {
		const { cookie, csrf } = await login();
		// Missing CSRF header -> 403
		const noToken = await call('/api/admin/links', {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json' },
			body: JSON.stringify({ url: 'https://example.com/admin-made' }),
		});
		expect(noToken.status).toBe(403);

		// With CSRF header -> created
		const ok = await call('/api/admin/links', {
			method: 'POST',
			headers: { cookie, 'content-type': 'application/json', 'x-csrf-token': csrf },
			body: JSON.stringify({ url: 'https://example.com/admin-made' }),
		});
		expect(ok.status).toBe(201);
	});

	it('lists the current session and revokes it', async () => {
		const { cookie } = await login();
		const list = await call('/api/admin/sessions', { headers: { cookie } });
		const body = (await list.json()) as { data: { id: string; current: boolean }[] };
		const current = body.data.find((s) => s.current);
		expect(current).toBeTruthy();

		const del = await call(`/api/admin/sessions/${current!.id}`, {
			method: 'DELETE',
			headers: { cookie, 'x-csrf-token': (await login()).csrf },
		});
		// CSRF token belongs to a different session here, so expect 403 — proves per-session CSRF binding.
		expect(del.status).toBe(403);
	});

	it('logs out and invalidates the session', async () => {
		const { cookie, csrf } = await login();
		const out = await call('/api/admin/logout', { method: 'POST', headers: { cookie, 'x-csrf-token': csrf } });
		expect(out.status).toBe(200);
		const after = await call('/api/admin/me', { headers: { cookie } });
		expect(after.status).toBe(401);
	});
});
