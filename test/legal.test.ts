import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';
import { isValidCustomId } from '../src/lib/id';

const get = async (path: string) => {
	const ctx = createExecutionContext();
	const res = await worker.fetch(new Request(`https://short.test${path}`), env, ctx);
	await waitOnExecutionContext(ctx);
	return res;
};

describe('legal pages', () => {
	it.each([
		['/privacy', 'Privacy policy'],
		['/terms', 'Terms of service'],
	])('serves %s as HTML', async (path, heading) => {
		const res = await get(path);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toContain('text/html');
		const html = await res.text();
		expect(html).toContain(`<h1>${heading}</h1>`);
		expect(html).toContain(`<link rel="canonical" href="https://short.test${path}" />`);
		expect(html).toContain('short.test');
	});

	it('lists both pages in the sitemap', async () => {
		const xml = await (await get('/sitemap.xml')).text();
		expect(xml).toContain('https://short.test/privacy');
		expect(xml).toContain('https://short.test/terms');
	});

	it('reserves the paths so no short link can shadow them', () => {
		expect(isValidCustomId('privacy')).toBe(false);
		expect(isValidCustomId('Terms')).toBe(false);
	});
});
