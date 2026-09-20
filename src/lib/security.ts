import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';

const GITHUB_AVATARS = 'https://avatars.githubusercontent.com';

// Strict policy for the dashboard SPA + API + redirects. The dashboard's JS is a
// self-hosted bundle (script-src 'self'); inline styles are allowed (fonts).
const APP_CSP = [
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

// Server-rendered landing page: scripts are a self-hosted file, styles are inline + fonts.
const LANDING_CSP = [
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

// Swagger UI ('/docs') bootstraps with an inline script and loads its bundle from jsDelivr.
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

/** Choose the CSP matching the route. Defaults to the strict app policy. */
function policyFor(pathname: string): string {
	if (pathname === '/') return LANDING_CSP;
	if (pathname === '/docs' || pathname.startsWith('/docs/')) return SWAGGER_CSP;
	return APP_CSP;
}

/**
 * Adds security headers to every response. Rebuilds the Response so it also works for
 * responses with immutable headers (e.g. those returned by the ASSETS binding).
 */
export const securityHeaders = (): MiddlewareHandler<AppEnv> => async (c, next) => {
	await next();

	const headers = new Headers(c.res.headers);
	for (const [k, v] of Object.entries(STATIC)) headers.set(k, v);
	headers.set('Content-Security-Policy', policyFor(new URL(c.req.url).pathname));

	c.res = new Response(c.res.body, { status: c.res.status, statusText: c.res.statusText, headers });
};
