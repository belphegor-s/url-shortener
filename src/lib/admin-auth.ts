import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';
import { fail } from './responses';
import { getSession, parseCookies, touchSession, timingSafeEqual, SESSION_COOKIE } from './session';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Client request metadata (Cloudflare-injected headers). */
export const clientMeta = (c: { req: { header: (k: string) => string | undefined } }) => ({
	ip: c.req.header('cf-connecting-ip') || '',
	userAgent: c.req.header('user-agent') || '',
	country: c.req.header('cf-ipcountry') || '',
});

/**
 * Session-cookie auth for the dashboard API.
 * - Validates the `__Host-session` cookie against D1.
 * - For mutating verbs, requires a matching `X-CSRF-Token` header (synchronizer token).
 * - Refreshes last_seen out of band.
 */
export const requireSession = (): MiddlewareHandler<AppEnv> => async (c, next) => {
	const token = parseCookies(c.req.header('cookie'))[SESSION_COOKIE];
	const session = await getSession(c.env, token);
	if (!session) return fail(c, 401, 'unauthorized', 'Not authenticated');

	if (MUTATING.has(c.req.method)) {
		const header = c.req.header('x-csrf-token') || '';
		if (!(await timingSafeEqual(header, session.csrf))) {
			return fail(c, 403, 'csrf', 'Invalid or missing CSRF token');
		}
	}

	c.set('sessionId', session.id);
	c.set('csrf', session.csrf);

	const meta = clientMeta(c);
	c.executionCtx.waitUntil(touchSession(c.env, session.id, { ip: meta.ip, country: meta.country }));

	await next();
};
