import { Hono } from 'hono';
import type { AppEnv } from '../types';

// Brand mark (violet rounded square + link glyph). Served for the Swagger/root pages
// so /favicon.ico doesn't fall through to the /:id redirect catch-all.
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#34d3ee"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 18.5a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M18.5 13.5a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 0 0 5.66 5.66l1-1"/></g></svg>`;

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
