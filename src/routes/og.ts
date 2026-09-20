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

const HEADLINE_TEXT = 'SHRTShort links, long reach.Fast, private URL shortening with edge analytics.1200';

/** Branded social card, rendered on the fly and cached in KV. */
og.get('/og.png', async (c) => {
	const cached = await c.env.LINKS_KV.get(KV_KEY, { type: 'arrayBuffer' });
	if (cached) return c.body(cached, 200, HEADERS);

	try {
		const font = await loadGoogleFont({ family: 'Inter', weight: 700, text: HEADLINE_TEXT });
		const card =
			'<div style="display:flex;flex-direction:column;width:1200px;height:630px;background-color:#060608;position:relative;overflow:hidden;padding:72px;font-family:Inter;">' +
			'<div style="display:flex;position:absolute;top:-240px;left:-160px;width:760px;height:760px;border-radius:9999px;background-image:linear-gradient(135deg, rgba(124,92,255,0.6), rgba(124,92,255,0));"></div>' +
			'<div style="display:flex;position:absolute;bottom:-260px;right:-180px;width:720px;height:720px;border-radius:9999px;background-image:linear-gradient(135deg, rgba(52,211,238,0.42), rgba(52,211,238,0));"></div>' +
			'<div style="display:flex;align-items:center;gap:18px;position:relative;">' +
			'<div style="display:flex;align-items:center;justify-content:center;width:66px;height:66px;border-radius:18px;background-image:linear-gradient(135deg,#7c5cff,#34d3ee);color:#ffffff;font-size:42px;font-weight:700;">S</div>' +
			'<div style="display:flex;font-size:36px;font-weight:700;color:#f5f5f7;letter-spacing:-1px;">SHRT</div>' +
			'</div>' +
			'<div style="display:flex;flex-direction:column;margin-top:auto;position:relative;">' +
			'<div style="display:flex;font-size:94px;font-weight:700;color:#f5f5f7;letter-spacing:-3px;line-height:1.02;">Short links,</div>' +
			'<div style="display:flex;font-size:94px;font-weight:700;letter-spacing:-3px;line-height:1.06;color:#7c5cff;">long reach.</div>' +
			'<div style="display:flex;margin-top:28px;font-size:30px;color:#a4a4b0;">Fast, private URL shortening with edge analytics.</div>' +
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
