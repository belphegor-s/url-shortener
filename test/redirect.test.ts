import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

const create = async (body: unknown): Promise<string> => {
	const ctx = createExecutionContext();
	const res = await worker.fetch(
		new Request('https://short.test/create', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
		}),
		env,
		ctx
	);
	await waitOnExecutionContext(ctx);
	return ((await res.json()) as { id: string }).id;
};

const get = async (id: string) => {
	const ctx = createExecutionContext();
	const res = await worker.fetch(new Request(`https://short.test/${id}`, { redirect: 'manual' }), env, ctx);
	await waitOnExecutionContext(ctx);
	return res;
};

describe('GET /:id', () => {
	it('redirects a known code with 302 and records a click', async () => {
		const id = await create({ url: 'https://example.com/target' });
		const res = await get(id);
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('https://example.com/target');
		expect(res.headers.get('cache-control')).toBe('no-store');

		// Analytics row written via waitUntil.
		const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM analytics WHERE short_id = ?').bind(id).first<{ n: number }>();
		expect(row?.n).toBeGreaterThanOrEqual(1);
	});

	it('returns 404 for an unknown code', async () => {
		const res = await get('does-not-exist');
		expect(res.status).toBe(404);
	});

	it('returns 410 for an expired link', async () => {
		const id = await create({ url: 'https://example.com/soon', expires_in: 1 });
		// Force expiry in D1 and purge any cache populated at create time.
		await env.DB.prepare("UPDATE urls SET expires_at = '2000-01-01T00:00:00Z' WHERE id = ?").bind(id).run();
		await env.LINKS_KV.delete(id);
		const res = await get(id);
		expect(res.status).toBe(410);
	});

	it('serves a warm hit from KV without a D1 row', async () => {
		const id = 'kvonly';
		await env.LINKS_KV.put(id, JSON.stringify({ u: 'https://example.com/kv', e: null, a: true }));
		const res = await get(id);
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('https://example.com/kv');
	});
});
