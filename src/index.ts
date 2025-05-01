import { Hono } from 'hono';
import { customAlphabet } from 'nanoid';
import { swaggerUI } from '@hono/swagger-ui';
import type { SwaggerUIOptions } from '@hono/swagger-ui';

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

const spec: SwaggerUIOptions['spec'] = {
	openapi: '3.1.0',
	info: {
		title: 'URL Shortener API',
		version: '1.0.0',
	},
	paths: {
		'/create': {
			post: {
				summary: 'Create a short URL',
				description:
					'Generate a shortened URL based on the original URL provided. Optionally, you can specify a custom ID for the shortened URL.',
				tags: ['URL Shortener'],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									url: {
										type: 'string',
										description: 'The original URL that needs to be shortened.',
										example: 'https://www.example.com',
									},
									custom_id: {
										type: 'string',
										description: 'Optional custom ID for the shortened URL.',
										example: 'my-short-url',
									},
								},
								required: ['url'],
							},
						},
					},
				},
				responses: {
					200: {
						description: 'Short URL created successfully or already exists',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										short_url: {
											type: 'string',
											description: 'The generated (or existing) shortened URL.',
											example: 'https://short.url/my-short-url',
										},
										existing: {
											type: 'boolean',
											description: 'True if the short URL already existed for the original URL.',
											example: false,
										},
									},
								},
							},
						},
					},
					400: {
						description: 'Bad request due to invalid or missing URL',
					},
					409: {
						description: 'Conflict — Custom ID already exists or insert error',
					},
					500: {
						description: 'Internal server error',
					},
				},
			},
		},
		'/analytics': {
			get: {
				summary: 'Get analytics summary',
				description:
					'Fetch analytics data, including click counts, first/last clicked timestamps, referrers, and country codes. You can paginate through the results using `page` and `limit` query parameters.',
				tags: ['Analytics'],
				parameters: [
					{
						name: 'x-api-key',
						in: 'header',
						required: true,
						schema: { type: 'string' },
						description: 'API key required for authentication.',
					},
					{
						name: 'page',
						in: 'query',
						required: false,
						schema: { type: 'integer', default: 1 },
						description: 'Page number for pagination (defaults to 1).',
					},
					{
						name: 'limit',
						in: 'query',
						required: false,
						schema: { type: 'integer', default: 50, minimum: 1, maximum: 500 },
						description: 'Number of records per page (default is 50, max 500).',
					},
					{
						name: 'sort',
						in: 'query',
						required: false,
						schema: { type: 'string', default: 'desc', enum: ['asc', 'desc'] },
						description: 'Sort order for results (defaults to `desc`).',
					},
				],
				responses: {
					200: {
						description: 'Analytics summary',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										page: { type: 'integer' },
										limit: { type: 'integer' },
										sort: { type: 'string' },
										data: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													short_id: { type: 'string' },
													click_count: { type: 'integer' },
													last_clicked: { type: 'string', format: 'date-time' },
													first_clicked: { type: 'string', format: 'date-time' },
													latest_referrer: { type: 'string' },
													country_code: { type: 'string' },
												},
											},
										},
									},
								},
							},
						},
					},
					401: {
						description: 'Unauthorized - Invalid API key',
					},
				},
			},
		},
		'/analytics/{id}': {
			get: {
				summary: 'Get full analytics for a short URL',
				description:
					'Retrieve detailed analytics for a specific shortened URL, including click data, referrers, user agents, and country codes.',
				tags: ['Analytics'],
				parameters: [
					{
						name: 'x-api-key',
						in: 'header',
						required: true,
						schema: { type: 'string' },
						description: 'API key required for authentication.',
					},
					{
						name: 'id',
						in: 'path',
						required: true,
						schema: { type: 'string' },
						description: 'The unique ID of the shortened URL whose analytics are being requested.',
					},
				],
				responses: {
					200: {
						description: 'Full analytics data for the requested short URL',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										click_count: { type: 'integer' },
										analytics: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													timestamp: { type: 'string', format: 'date-time' },
													ip: { type: 'string' },
													user_agent: { type: 'string' },
													referrer: { type: 'string' },
													country_code: { type: 'string' },
												},
											},
										},
									},
								},
							},
						},
					},
					401: {
						description: 'Unauthorized - Invalid API key',
					},
				},
			},
		},
	},
	tags: [
		{
			name: 'URL Shortener',
			description: 'Endpoints for creating short URLs and handling related requests.',
		},
		{
			name: 'Analytics',
			description: 'Endpoints for fetching analytics related to the shortened URLs.',
		},
	],
};

app.get('/docs', swaggerUI({ spec, urls: [] }));

app.post('/create', async (c) => {
	const { DB } = c.env as Bindings;
	const body = await c.req.json();
	const { url, custom_id } = body;

	if (!url || !isValidUrl(url)) return c.text('Missing url', 400);

	if (custom_id) {
		const exists = await DB.prepare(`SELECT id FROM urls WHERE id = ?`).bind(custom_id).first();
		if (exists) return c.text('Custom ID already in use', 409);
	} else {
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
		return c.json({ short_url, existing: false });
	} catch (err) {
		console.error('Insert failed:', err);
		return c.text('Internal Server Error', 500);
	}
});

app.get('/analytics', async (c) => {
	const { DB, API_KEY } = c.env as Bindings;
	const key = c.req.header('x-api-key');
	if (key !== API_KEY) return c.text('Unauthorized', 401);

	const page = Math.max(1, parseInt(c.req.query('page') || '1'));
	const limit = Math.max(1, Math.min(parseInt(c.req.query('limit') || '50'), 500));
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
