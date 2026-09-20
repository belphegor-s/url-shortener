import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';
import { fail } from './responses';
import { getSession, parseCookies, touchSession, timingSafeEqual, SESSION_COOKIE } from './session';
import { getUser } from './users';
import { resolveApiKey, touchApiKey } from './api-keys';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Client request metadata (Cloudflare-injected headers). */
export const clientMeta = (c: { req: { header: (k: string) => string | undefined } }) => ({
	ip: c.req.header('cf-connecting-ip') || '',
	userAgent: c.req.header('user-agent') || '',
	country: c.req.header('cf-ipcountry') || '',
});

/**
 * Session-cookie auth.
 * - Validates the `__Host-session` cookie against D1 and loads the owning user.
 * - For mutating verbs, requires a matching `X-CSRF-Token` header (synchronizer token).
 * - Refreshes last_seen out of band.
 */
export const requireUser = (): MiddlewareHandler<AppEnv> => async (c, next) => {
	const token = parseCookies(c.req.header('cookie'))[SESSION_COOKIE];
	const session = await getSession(c.env, token);
	if (!session) return fail(c, 401, 'unauthorized', 'Not authenticated');

	const user = await getUser(c.env, session.user_id!);
	if (!user) return fail(c, 401, 'unauthorized', 'Not authenticated');

	if (MUTATING.has(c.req.method)) {
		const header = c.req.header('x-csrf-token') || '';
		if (!(await timingSafeEqual(header, session.csrf))) {
			return fail(c, 403, 'csrf', 'Invalid or missing CSRF token');
		}
	}

	c.set('sessionId', session.id);
	c.set('csrf', session.csrf);
	c.set('user', user);

	const meta = clientMeta(c);
	c.executionCtx.waitUntil(touchSession(c.env, session.id, { ip: meta.ip, country: meta.country }));

	await next();
};

/**
 * Accepts either a logged-in session *or* a per-account bearer API key. Both resolve
 * to a user, so every programmatic request is owned and scoped to an account.
 */
export const requireUserOrApiKey = (): MiddlewareHandler<AppEnv> => async (c, next) => {
	const header = c.req.header('authorization');
	if (header?.startsWith('Bearer ')) {
		const resolved = await resolveApiKey(c.env, header.slice('Bearer '.length));
		if (!resolved) return fail(c, 401, 'unauthorized', 'Invalid API key');
		c.set('user', resolved.user);
		c.set('apiKeyId', resolved.keyId);
		c.executionCtx.waitUntil(touchApiKey(c.env, resolved.keyId));
		return next();
	}
	return requireUser()(c, next);
};

/** Guard for platform-admin-only endpoints. Must run after `requireUser`. */
export const requireAdmin = (): MiddlewareHandler<AppEnv> => async (c, next) => {
	if (c.get('user')?.role !== 'admin') return fail(c, 403, 'forbidden', 'Admin access required');
	await next();
};
