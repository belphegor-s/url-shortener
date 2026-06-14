import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv } from '../types';

export const dashboard = new Hono<AppEnv>();

/**
 * Serve the built React dashboard (Vite base `/admin/`) from the ASSETS binding.
 *
 * The app is built flat into dist-admin (index.html + assets/), so we strip the
 * `/admin` prefix before asking the binding, and fall back to index.html for
 * client-side routes (SPA). Real files (JS/CSS) resolve directly.
 */
async function serve(c: Context<AppEnv>) {
	const url = new URL(c.req.url);
	const assetPath = url.pathname.replace(/^\/admin/, '') || '/';
	const origin = url.origin;

	let res = await c.env.ASSETS.fetch(new Request(`${origin}${assetPath}`, c.req.raw));
	if (res.status === 404) {
		// SPA fallback — let React Router handle the path.
		res = await c.env.ASSETS.fetch(new Request(`${origin}/index.html`));
	}
	return res;
}

dashboard.get('/admin', serve);
dashboard.get('/admin/*', serve);
