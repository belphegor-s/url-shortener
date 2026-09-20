import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../types';
import { getSession, parseCookies, SESSION_COOKIE } from '../lib/session';
import { getUser } from '../lib/users';
import { renderLanding } from '../landing/page';
import { script } from '../landing/script';

export const home = new Hono<AppEnv>();

/** Load the signed-in user if a valid session cookie is present, without requiring auth. */
async function currentUser(c: Context<AppEnv>) {
	const token = parseCookies(c.req.header('cookie'))[SESSION_COOKIE];
	const session = await getSession(c.env, token);
	if (!session) return { user: null, csrf: '' };
	const user = await getUser(c.env, session.user_id!);
	return { user, csrf: session.csrf };
}

home.get('/', async (c) => {
	const { user, csrf } = await currentUser(c);
	const origin = new URL(c.req.url).origin;
	const html = renderLanding({
		origin,
		baseUrl: c.env.SHORT_DOMAIN || origin,
		user,
		csrf,
		authError: c.req.query('auth_error'),
		repoUrl: 'https://github.com/belphegor-s/url-shortener',
	});
	return c.html(html);
});

// The landing script is served as its own asset so the page can keep a strict CSP
// (`script-src 'self'`) without nonces or inline scripts.
home.get('/landing.js', (c) =>
	c.body(script, 200, {
		'content-type': 'application/javascript; charset=utf-8',
		'cache-control': 'public, max-age=3600, s-maxage=86400',
	})
);

home.get('/robots.txt', (c) => {
	const origin = new URL(c.req.url).origin;
	return c.body(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /auth/\nDisallow: /dashboard\n\nSitemap: ${origin}/sitemap.xml\n`, 200, {
		'content-type': 'text/plain; charset=utf-8',
		'cache-control': 'public, max-age=86400',
	});
});

home.get('/sitemap.xml', (c) => {
	const origin = new URL(c.req.url).origin;
	const today = new Date().toISOString().slice(0, 10);
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${origin}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>
  <url><loc>${origin}/docs</loc><lastmod>${today}</lastmod><priority>0.6</priority></url>
</urlset>
`;
	return c.body(xml, 200, { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=86400' });
});

home.get('/manifest.webmanifest', (c) =>
	c.body(
		JSON.stringify({
			name: 'SHRT — URL Shortener',
			short_name: 'SHRT',
			description: 'Short links, long reach.',
			start_url: '/',
			display: 'standalone',
			background_color: '#060608',
			theme_color: '#060608',
			icons: [
				{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
				{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
				{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
			],
		}),
		200,
		{ 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'public, max-age=86400' }
	)
);
