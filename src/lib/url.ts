import type { Context } from 'hono';
import type { AppEnv } from '../types';

/** Build the absolute short URL, preferring the configured public domain over the request origin. */
export function shortUrl(c: Context<AppEnv>, id: string): string {
	const base = c.env.SHORT_DOMAIN || new URL(c.req.url).origin;
	return `${base.replace(/\/$/, '')}/${id}`;
}
