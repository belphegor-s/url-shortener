import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';
import { fail } from './responses';

/** Constant-time string comparison via SHA-256 digests (avoids early-exit timing leaks). */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
	const enc = new TextEncoder();
	const [ha, hb] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
	const va = new Uint8Array(ha);
	const vb = new Uint8Array(hb);
	let diff = 0;
	for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
	return diff === 0;
}

/**
 * Middleware factory guarding routes with a static bearer token.
 * Reused by every analytics endpoint to kill the previous 3x duplication.
 */
export const requireAuth = (): MiddlewareHandler<AppEnv> => async (c, next) => {
	const header = c.req.header('authorization');
	if (!header || !header.startsWith('Bearer ')) {
		return fail(c, 401, 'unauthorized', 'Missing or invalid Authorization header');
	}

	const token = header.slice('Bearer '.length);
	if (!(await timingSafeEqual(token, c.env.API_KEY))) {
		return fail(c, 401, 'unauthorized', 'Invalid token');
	}

	await next();
};
