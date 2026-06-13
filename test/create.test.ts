import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

const post = async (body: unknown) => {
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
	return res;
};

describe('POST /create', () => {
	it('creates a short url for a valid url', async () => {
		const res = await post({ url: 'https://example.com/a' });
		expect(res.status).toBe(201);
		const json = (await res.json()) as { short_url: string; id: string; existing: boolean };
		expect(json.existing).toBe(false);
		expect(json.short_url).toContain(json.id);
	});

	it('rejects a non-http url', async () => {
		const res = await post({ url: 'javascript:alert(1)' });
		expect(res.status).toBe(400);
	});

	it('rejects a missing url', async () => {
		const res = await post({});
		expect(res.status).toBe(400);
	});

	it('honours a valid custom_id and rejects reuse', async () => {
		const first = await post({ url: 'https://example.com/custom', custom_id: 'mycode' });
		expect(first.status).toBe(201);
		const dup = await post({ url: 'https://example.com/other', custom_id: 'mycode' });
		expect(dup.status).toBe(409);
	});

	it('rejects a reserved custom_id', async () => {
		const res = await post({ url: 'https://example.com/x', custom_id: 'analytics' });
		expect(res.status).toBe(400);
	});

	it('dedupes the same original url', async () => {
		const url = 'https://example.com/dedup';
		const a = (await (await post({ url })).json()) as { id: string };
		const second = await post({ url });
		const b = (await second.json()) as { id: string; existing: boolean };
		expect(b.existing).toBe(true);
		expect(b.id).toBe(a.id);
	});

	it('rejects an expiry in the past', async () => {
		const res = await post({ url: 'https://example.com/expired', expires_at: '2000-01-01T00:00:00Z' });
		expect(res.status).toBe(400);
	});
});
