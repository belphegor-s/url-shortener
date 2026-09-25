import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../types';
import { getSession, parseCookies, SESSION_COOKIE } from '../lib/session';
import { getUser } from '../lib/users';
import { REPO_URL, landingJs } from '../landing/chrome';
import { renderLanding } from '../landing/page';
import { renderDocs } from '../landing/docs';
import { renderLegal } from '../landing/legal';
import { spec } from '../openapi/spec';

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
		repoUrl: REPO_URL,
	});
	return c.html(html);
});

// Server-rendered API reference. Replaces the third-party Swagger UI bundle so the
// docs share the site's design system and keep the same strict CSP.
home.get('/docs', async (c) => {
	const { user, csrf } = await currentUser(c);
	const origin = new URL(c.req.url).origin;
	return c.html(renderDocs({ origin, baseUrl: c.env.SHORT_DOMAIN || origin, user, csrf }));
});

// Privacy policy and terms, server-rendered in the same shell as the docs.
for (const kind of ['privacy', 'terms'] as const) {
	home.get(`/${kind}`, async (c) => {
		const { user, csrf } = await currentUser(c);
		return c.html(renderLegal(kind, { origin: new URL(c.req.url).origin, user, csrf }));
	});
}

// Machine-readable description of the same API, for client generators and Postman.
home.get('/openapi.json', (c) =>
	c.body(JSON.stringify(spec), 200, {
		'content-type': 'application/json; charset=utf-8',
		'cache-control': 'public, max-age=3600',
	})
);

// The public-site script is served as its own asset so the page can keep a strict CSP
// (`script-src 'self'`) without nonces or inline scripts.
home.get('/landing.js', (c) =>
	// Pages reference it as /landing.js?v=<content hash>, so each version is a new URL.
	c.body(landingJs, 200, {
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
  <url><loc>${origin}/privacy</loc><lastmod>${today}</lastmod><priority>0.3</priority></url>
  <url><loc>${origin}/terms</loc><lastmod>${today}</lastmod><priority>0.3</priority></url>
</urlset>
`;
	return c.body(xml, 200, { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=86400' });
});

home.get('/manifest.webmanifest', (c) =>
	c.body(
		JSON.stringify({
			name: 'SHRT - URL Shortener',
			short_name: 'SHRT',
			description: 'Short links, long reach.',
			start_url: '/',
			display: 'standalone',
			background_color: '#09090b',
			theme_color: '#09090b',
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
