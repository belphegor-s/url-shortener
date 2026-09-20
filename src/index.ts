import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { AppEnv } from './types';
import { fail } from './lib/responses';
import { securityHeaders } from './lib/security';
import { home } from './routes/home';
import { og } from './routes/og';
import { create } from './routes/create';
import { analytics } from './routes/analytics';
import { auth } from './routes/auth';
import { api } from './routes/api';
import { dashboard } from './routes/assets';
import { favicon } from './routes/favicon';
import { redirect } from './routes/redirect';

const app = new Hono<AppEnv>();

// Security headers on every response (runs first, wraps everything).
app.use('*', securityHeaders());

// --- CORS for the public programmatic API. The dashboard API is same-origin (cookies). ---
app.use('*', (c, next) => {
	const allowed = (c.env.ALLOWED_ORIGINS ?? '*').split(',').map((s) => s.trim());
	const origin = allowed.includes('*') ? '*' : (o: string) => (allowed.includes(o) ? o : allowed[0] ?? '');
	return cors({
		origin,
		allowHeaders: ['content-type', 'authorization'],
		allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
		maxAge: 86400,
	})(c, next);
});

// --- Rate limit POST /create per client IP. Fails open if the binding is absent (e.g. tests). ---
app.use('/create', async (c, next) => {
	const limiter = c.env.CREATE_LIMITER;
	if (limiter) {
		const key = c.req.header('cf-connecting-ip') || 'anonymous';
		const { success } = await limiter.limit({ key });
		if (!success) return fail(c, 429, 'rate_limited', 'Too many requests, slow down');
	}
	await next();
});

// Landing page + static site routes (robots, sitemap, manifest, landing.js).
app.route('/', home);

// Dynamic social image.
app.route('/', og);

// Favicon (before the redirect catch-all).
app.route('/', favicon);

// GitHub OAuth + logout.
app.route('/', auth);

// Dashboard SPA (static) served under /dashboard.
app.route('/', dashboard);

// Dashboard JSON API (sessions).
app.route('/', api);

// Public programmatic API.
app.route('/', create);
app.route('/', analytics);

// Redirect catch-all — must stay last so it never shadows the routes above.
app.route('/', redirect);

app.notFound((c) => fail(c, 404, 'not_found', 'Resource not found'));
app.onError((err, c) => {
	console.error('unhandled error', String(err));
	return fail(c, 500, 'internal_error', 'Internal Server Error');
});

export default app;
