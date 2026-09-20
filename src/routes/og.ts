import { Hono } from 'hono';
import { ImageResponse, loadGoogleFont } from 'workers-og';
import type { AppEnv } from '../types';

export const og = new Hono<AppEnv>();

const KV_KEY = 'og:default';
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const HEADERS = {
	'content-type': 'image/png',
	'cache-control': 'public, max-age=86400, s-maxage=604800, immutable',
};

const HEADLINE_TEXT = 'SHRTShort links, long reach.Open-source URL shortening with edge analytics.short.procd.cc';

/** Branded social card, rendered on the fly and cached in KV. */
og.get('/og.png', async (c) => {
	const cached = await c.env.LINKS_KV.get(KV_KEY, { type: 'arrayBuffer' });
	if (cached) return c.body(cached, 200, HEADERS);

	try {
		const font = await loadGoogleFont({ family: 'Inter', weight: 700, text: HEADLINE_TEXT });
		// Mirrors the site's dark theme: zinc canvas, faint grid, monochrome type.
		const card =
			'<div style="display:flex;flex-direction:column;width:1200px;height:630px;background-color:#09090b;position:relative;overflow:hidden;padding:80px;font-family:Inter;">' +
			'<div style="display:flex;position:absolute;top:0;left:0;width:1200px;height:630px;background-image:linear-gradient(90deg,rgba(250,250,250,0.05) 1px,transparent 1px),linear-gradient(180deg,rgba(250,250,250,0.05) 1px,transparent 1px);background-size:56px 56px;"></div>' +
			'<div style="display:flex;align-items:center;position:relative;">' +
			'<div style="display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background-color:#fafafa;color:#09090b;font-size:32px;font-weight:700;">S</div>' +
			'<div style="display:flex;margin-left:16px;font-size:30px;font-weight:700;color:#fafafa;letter-spacing:-0.5px;">SHRT</div>' +
			'</div>' +
			'<div style="display:flex;flex-direction:column;margin-top:auto;position:relative;">' +
			'<div style="display:flex;font-size:92px;font-weight:700;color:#fafafa;letter-spacing:-4px;line-height:1.04;">Short links,</div>' +
			'<div style="display:flex;font-size:92px;font-weight:700;color:#71717a;letter-spacing:-4px;line-height:1.08;">long reach.</div>' +
			'<div style="display:flex;margin-top:32px;font-size:28px;color:#a1a1aa;">Open-source URL shortening with edge analytics.</div>' +
			'</div>' +
			'</div>';

		const image = new ImageResponse(
			card,
			{
				width: 1200,
				height: 630,
				fonts: [{ name: 'Inter', data: font, weight: 700, style: 'normal' }],
			}
		);

		const buf = await image.arrayBuffer();
		c.executionCtx.waitUntil(c.env.LINKS_KV.put(KV_KEY, buf, { expirationTtl: CACHE_TTL_SECONDS }));
		return c.body(buf, 200, HEADERS);
	} catch (err) {
		console.error('og image generation failed', String(err));
		return c.text('Could not generate image', 500, { 'cache-control': 'no-store' });
	}
});
