import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';

import type { AppEnv } from './types';
import { spec } from './openapi/spec';
import { fail } from './lib/responses';
import { create } from './routes/create';
import { analytics } from './routes/analytics';
import { redirect } from './routes/redirect';

const app = new Hono<AppEnv>();

// --- CORS: origins driven by ALLOWED_ORIGINS env ("*" or comma-separated list). ---
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

// Swagger UI at root.
app.get('/', swaggerUI({ spec, urls: [], title: 'URL Shortener API' }));

// Routes (redirect catch-all must stay last so it doesn't shadow the others).
app.route('/', create);
app.route('/', analytics);
app.route('/', redirect);

app.notFound((c) => fail(c, 404, 'not_found', 'Resource not found'));
app.onError((err, c) => {
	console.error('unhandled error', String(err));
	return fail(c, 500, 'internal_error', 'Internal Server Error');
});

export default app;
