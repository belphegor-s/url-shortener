import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

const getAnalytics = async (headers: Record<string, string> = {}) => {
	const ctx = createExecutionContext();
	const res = await worker.fetch(new Request('https://short.test/analytics', { headers }), env, ctx);
	await waitOnExecutionContext(ctx);
	return res;
};

describe('analytics auth', () => {
	it('rejects a missing token', async () => {
		expect((await getAnalytics()).status).toBe(401);
	});

	it('rejects a wrong token', async () => {
		expect((await getAnalytics({ authorization: 'Bearer nope' })).status).toBe(401);
	});

	it('accepts the valid token', async () => {
		const res = await getAnalytics({ authorization: `Bearer ${env.API_KEY}` });
		expect(res.status).toBe(200);
	});
});
