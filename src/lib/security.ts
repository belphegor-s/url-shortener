import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';

const GITHUB_AVATARS = 'https://avatars.githubusercontent.com';

// One strict policy for the whole app. Every script is a self-hosted bundle
// (`script-src 'self'`, no nonce, no unsafe-inline); inline styles and Google Fonts
// cover the server-rendered public site and the dashboard SPA alike.
const CSP = [
	"default-src 'self'",
	"base-uri 'self'",
	"frame-ancestors 'self'",
	"form-action 'self'",
	"object-src 'none'",
	`img-src 'self' data: ${GITHUB_AVATARS}`,
	"font-src 'self' https://fonts.gstatic.com",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"script-src 'self' https://static.cloudflareinsights.com",
	"connect-src 'self' https://cloudflareinsights.com",
].join('; ');

const STATIC = {
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'SAMEORIGIN',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
};

/**
 * Adds security headers to every response. Rebuilds the Response so it also works for
 * responses with immutable headers (e.g. those returned by the ASSETS binding).
 */
export const securityHeaders = (): MiddlewareHandler<AppEnv> => async (c, next) => {
	await next();

	const headers = new Headers(c.res.headers);
	for (const [k, v] of Object.entries(STATIC)) headers.set(k, v);
	headers.set('Content-Security-Policy', CSP);

	c.res = new Response(c.res.body, { status: c.res.status, statusText: c.res.statusText, headers });
};
