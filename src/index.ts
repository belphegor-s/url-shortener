import { Hono } from 'hono';
import { customAlphabet } from 'nanoid';

const app = new Hono();

type Bindings = {
	DB: D1Database;
	API_KEY: string;
};

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 7);

const isValidUrl = (url: string) => {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
};

const isBot = (userAgent: string): boolean => {
	const botPattern = /bot|crawl|spider|robot/i;
	return botPattern.test(userAgent);
};

app.post('/create', async (c) => {
	const { DB } = c.env as Bindings;
	const body = await c.req.json();
	const { url, custom_id } = body;

	if (!url || !isValidUrl(url)) return c.text('Missing url', 400);

	if (!custom_id) {
		const existing = await DB.prepare(`SELECT id FROM urls WHERE original_url = ?`).bind(url).first();

		if (existing) {
			const short_url = `${new URL(c.req.url).origin}/${existing.id}`;
			return c.json({ short_url, existing: true });
		}
	}

	const id = custom_id || nanoid();

	try {
		await DB.prepare(`INSERT INTO urls (id, original_url) VALUES (?, ?)`).bind(id, url).run();

		const short_url = `${new URL(c.req.url).origin}/${id}`;
		return c.json({ short_url });
	} catch {
		return c.text('Conflict or error', 409);
	}
});

app.get('/analytics', async (c) => {
	const { DB, API_KEY } = c.env as Bindings;
	const key = c.req.header('x-api-key');
	if (key !== API_KEY) return c.text('Unauthorized', 401);

	const page = parseInt(c.req.query('page') || '1');
	const limit = parseInt(c.req.query('limit') || '50');
	const sort = (c.req.query('sort') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

	const offset = (page - 1) * limit;

	const result = await DB.prepare(
		`
		SELECT
		  short_id,
		  COUNT(*) AS click_count,
		  MAX(timestamp) AS last_clicked,
		  MIN(timestamp) AS first_clicked,
		  MAX(CASE WHEN timestamp = (SELECT MAX(timestamp) FROM analytics AS a2 WHERE a2.short_id = a1.short_id) THEN referrer ELSE NULL END) AS latest_referrer,
		  MAX(country_code) AS country_code
		FROM analytics AS a1
		GROUP BY short_id
		ORDER BY last_clicked ${sort}
		LIMIT ? OFFSET ?
	  `
	)
		.bind(limit, offset)
		.all();

	return c.json({
		page,
		limit,
		sort,
		data: result.results,
	});
});

app.get('/:id', async (c) => {
	const { DB } = c.env as Bindings;
	const id = c.req.param('id');

	const result = await DB.prepare(`SELECT original_url FROM urls WHERE id = ?`).bind(id).first();

	if (!result) return c.text('Not found', 404);

	const original_url = result.original_url as string;

	await DB.prepare(
		`
		INSERT INTO analytics (short_id, ip, user_agent, country_code, referrer)
		VALUES (?, ?, ?, ?, ?)
	  `
	)
		.bind(
			id,
			c.req.header('cf-connecting-ip') || '',
			c.req.header('user-agent') || '',
			c.req.header('cf-ipcountry') || '',
			c.req.header('referer') || ''
		)
		.run();

	return c.redirect(original_url, 302);
});

app.get('/analytics/:id', async (c) => {
	const { DB, API_KEY } = c.env as Bindings;
	const key = c.req.header('x-api-key');
	if (key !== API_KEY) return c.text('Unauthorized', 401);

	const id = c.req.param('id');

	const result = await DB.prepare(
		`
		SELECT timestamp, ip, user_agent, referrer, country_code
		FROM analytics WHERE short_id = ?
		ORDER BY timestamp DESC
		LIMIT 1000
	  `
	)
		.bind(id)
		.all();

	return c.json({
		id,
		click_count: result.results.length,
		analytics: result.results,
	});
});

export default app;
