import { Hono } from 'hono';
import type { AppEnv } from '../types';

// Brand mark: a monochrome rounded square with the link glyph knocked out of it,
// inverted in dark mode so it reads against either browser chrome. Served here so
// /favicon.ico does not fall through to the /:id redirect catch-all. Keep in step
// with scripts/generate-assets.mjs, which rasterises the same mark to PNG.
const FAVICON =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">' +
	'<style>:root{--bg:#09090b;--fg:#fafafa}@media (prefers-color-scheme:dark){:root{--bg:#fafafa;--fg:#09090b}}</style>' +
	'<rect width="32" height="32" rx="8" fill="var(--bg)"/>' +
	'<g fill="none" stroke="var(--fg)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
	'<path d="M13.5 18.5a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 0 0-5.66-5.66l-1 1"/>' +
	'<path d="M18.5 13.5a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 0 0 5.66 5.66l1-1"/>' +
	'</g></svg>';

export const favicon = new Hono<AppEnv>();

const serve = () =>
	new Response(FAVICON, {
		headers: {
			'content-type': 'image/svg+xml',
			'cache-control': 'public, max-age=86400, immutable',
		},
	});

// PNG fallbacks (browsers without SVG favicon support, and iOS apple-touch-icon)
// are served from the static assets binding.
const servePng = () => async (c: import('hono').Context<AppEnv>) => {
	const res = await c.env.ASSETS.fetch(new Request(new URL(c.req.path, c.req.url).toString()));
	if (res.status !== 200) return c.notFound();
	return new Response(res.body, {
		status: 200,
		headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400, immutable' },
	});
};

favicon.get('/favicon.svg', serve);
favicon.get('/favicon.ico', serve);
favicon.get('/favicon-32.png', servePng());
favicon.get('/favicon-16.png', servePng());
favicon.get('/apple-touch-icon.png', servePng());
favicon.get('/icon-192.png', servePng());
favicon.get('/icon-512.png', servePng());
