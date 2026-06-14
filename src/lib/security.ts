import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';

// Strict policy for the app + API + redirects. The dashboard's own JS is a self-hosted
// bundle (script-src 'self'); inline styles are allowed (low risk, used by fonts).
const APP_CSP = [
	"default-src 'self'",
	"base-uri 'self'",
	"frame-ancestors 'self'",
	"object-src 'none'",
	"img-src 'self' data:",
	"font-src 'self' https://fonts.gstatic.com",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"script-src 'self' https://static.cloudflareinsights.com",
	"connect-src 'self' https://cloudflareinsights.com",
].join('; ');

// Swagger UI ('/') bootstraps with an inline script and loads its bundle from jsDelivr.
const SWAGGER_CSP = [
	"default-src 'self'",
	"base-uri 'self'",
	"frame-ancestors 'self'",
	"object-src 'none'",
	"img-src 'self' data: https://cdn.jsdelivr.net https://validator.swagger.io",
	"font-src 'self' https://fonts.gstatic.com",
	"style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
	"script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
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
	headers.set('Content-Security-Policy', new URL(c.req.url).pathname === '/' ? SWAGGER_CSP : APP_CSP);

	c.res = new Response(c.res.body, { status: c.res.status, statusText: c.res.statusText, headers });
};
