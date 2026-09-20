import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';
import { seedUser, seedApiKey } from './helpers';

const call = async (path: string, headers: Record<string, string> = {}) => {
	const ctx = createExecutionContext();
	const res = await worker.fetch(new Request(`https://short.test${path}`, { headers }), env, ctx);
	await waitOnExecutionContext(ctx);
	return res;
};

const createLink = async (bearer: string, url: string): Promise<string> => {
	const ctx = createExecutionContext();
	const res = await worker.fetch(
		new Request('https://short.test/create', {
			method: 'POST',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
			body: JSON.stringify({ url }),
		}),
		env,
		ctx
	);
	await waitOnExecutionContext(ctx);
	return ((await res.json()) as { id: string }).id;
};

/** Visit a link so it produces an analytics row (the summary lists clicked links only). */
const hit = async (id: string) => {
	const ctx = createExecutionContext();
	await worker.fetch(new Request(`https://short.test/${id}`, { redirect: 'manual' }), env, ctx);
	await waitOnExecutionContext(ctx);
};

describe('programmatic API auth', () => {
	it('rejects a missing or invalid key', async () => {
		expect((await call('/analytics')).status).toBe(401);
		expect((await call('/analytics', { authorization: 'Bearer nope' })).status).toBe(401);
		expect((await call('/analytics', { authorization: 'Bearer shrt_not-real' })).status).toBe(401);
	});

	it('scopes results to the key owner', async () => {
		const a = await seedUser();
		const b = await seedUser();
		const keyA = await seedApiKey(a.id);
		const keyB = await seedApiKey(b.id);

		const idA = await createLink(keyA, 'https://example.com/a-owner');
		const idB = await createLink(keyB, 'https://example.com/b-owner');
		await hit(idA);
		await hit(idB);

		const listA = (await (await call('/analytics', { authorization: `Bearer ${keyA}` })).json()) as { data: { short_id: string }[] };
		const idsA = listA.data.map((r) => r.short_id);
		expect(idsA).toContain(idA);
		expect(idsA).not.toContain(idB);

		// A cannot read B's link detail.
		expect((await call(`/analytics/${idB}`, { authorization: `Bearer ${keyA}` })).status).toBe(404);
		expect((await call(`/analytics/${idA}`, { authorization: `Bearer ${keyA}` })).status).toBe(200);

		// B sees their own link.
		const listB = (await (await call('/analytics', { authorization: `Bearer ${keyB}` })).json()) as { data: { short_id: string }[] };
		expect(listB.data.map((r) => r.short_id)).toContain(idB);
	});
});
