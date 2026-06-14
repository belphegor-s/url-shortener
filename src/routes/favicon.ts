import { Hono } from 'hono';
import type { AppEnv } from '../types';

// Brand mark (violet rounded square + link glyph). Served for the Swagger/root pages
// so /favicon.ico doesn't fall through to the /:id redirect catch-all.
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="8" fill="#7c5cff"/><g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 18.5a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M18.5 13.5a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 0 0 5.66 5.66l1-1"/></g></svg>`;

export const favicon = new Hono<AppEnv>();

const serve = () =>
	new Response(FAVICON, {
		headers: {
			'content-type': 'image/svg+xml',
			'cache-control': 'public, max-age=86400, immutable',
		},
	});

favicon.get('/favicon.svg', serve);
favicon.get('/favicon.ico', serve);
