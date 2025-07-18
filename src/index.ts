import { Hono } from 'hono';
import { customAlphabet } from 'nanoid';
import { swaggerUI } from '@hono/swagger-ui';
import type { SwaggerUIOptions } from '@hono/swagger-ui';
import { cors } from 'hono/cors';

const app = new Hono();

app.use(
	'*',
	cors({
		origin: 'http://localhost:3000',
		allowHeaders: ['content-type', 'authorization'],
		allowMethods: ['GET', 'POST', 'OPTIONS'],
		maxAge: 0,
	})
);

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
					'Generate a shortened URL based on the original URL provided as a query parameter. Optionally, you can specify a custom ID for the shortened URL.',
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
											example: 'https://mini-url.in/my-short-url',
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
						description: 'Conflict — Custom ID already in use',
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
				security: [
					{
						bearerAuth: [],
					},
				],
				parameters: [
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
										total: {
											type: 'integer',
											description: 'Total number of unique short links (short_id)',
										},
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
													original_url: { type: 'string' },
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
			delete: {
				summary: 'Delete analytics and short URLs',
				description: 'Delete all analytics records and associated short URLs for the given list of short IDs. Requires a valid API key.',
				tags: ['Analytics'],
				security: [
					{
						bearerAuth: [],
					},
				],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								required: ['ids'],
								properties: {
									ids: {
										type: 'array',
										items: { type: 'string' },
										description: 'List of short_id values to delete analytics and URL entries for.',
									},
								},
								example: {
									ids: ['abc123', 'xyz789'],
								},
							},
						},
					},
				},
				responses: {
					200: {
						description: 'Analytics and URL entries successfully deleted.',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										success: { type: 'boolean', example: true },
										ids: {
											type: 'array',
											items: { type: 'string' },
											description: 'IDs that were deleted.',
										},
									},
								},
							},
						},
					},
					400: {
						description: 'Invalid request body — `ids` is missing or empty.',
					},
					401: {
						description: 'Unauthorized — Invalid API key.',
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
				security: [
					{
						bearerAuth: [],
					},
				],
				parameters: [
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
													original_url: { type: 'string' },
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
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
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

app.get('/', swaggerUI({ spec, urls: [], title: 'URL Shortener API' }));

app.post('/create', async (c) => {
	const { DB } = c.env as Bindings;
	const { url, custom_id } = await c.req.json();

	if (!url || !isValidUrl(url)) return c.text('Missing or invalid url', 400);

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
	const authHeader = c.req.header('authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
	}

	const key = authHeader.split(' ')[1];
	if (key !== API_KEY) return c.text('Unauthorized', 401);

	const page = Math.max(1, parseInt(c.req.query('page') || '1'));
	const limit = Math.max(1, Math.min(parseInt(c.req.query('limit') || '50'), 500));
	const sort = (c.req.query('sort') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

	const offset = (page - 1) * limit;

	const totalResult = await DB.prepare(
		`
		SELECT COUNT(DISTINCT short_id) AS total FROM analytics
	`
	).first<{ total: number }>();

	const result = await DB.prepare(
		`
		SELECT
		  a1.short_id,
		  u.original_url,
		  COUNT(*) AS click_count,
		  MAX(timestamp) AS last_clicked,
		  MIN(timestamp) AS first_clicked,
		  MAX(CASE WHEN timestamp = (SELECT MAX(timestamp) FROM analytics AS a2 WHERE a2.short_id = a1.short_id) THEN referrer ELSE NULL END) AS latest_referrer,
		  MAX(country_code) AS country_code
		FROM analytics AS a1
		JOIN urls AS u ON a1.short_id = u.id
		GROUP BY a1.short_id, u.original_url
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
		total: totalResult?.total || 0,
		data: result.results,
	});
});

app.delete('/analytics', async (c) => {
	const { DB, API_KEY } = c.env as Bindings;
	const authHeader = c.req.header('authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
	}

	const key = authHeader.split(' ')[1];
	if (key !== API_KEY) return c.text('Unauthorized', 401);

	const body = await c.req.json();
	const ids = body.ids as string[];

	if (!Array.isArray(ids) || ids.length === 0) {
		return c.text('Invalid request body', 400);
	}

	const placeholders = ids.map(() => '?').join(',');

	await DB.batch([
		DB.prepare(`DELETE FROM analytics WHERE short_id IN (${placeholders})`).bind(...ids),
		DB.prepare(`DELETE FROM urls WHERE id IN (${placeholders})`).bind(...ids),
	]);

	return c.json({ success: true, ids });
});

app.get('/analytics/:id', async (c) => {
	const { DB, API_KEY } = c.env as Bindings;
	const authHeader = c.req.header('authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
	}

	const key = authHeader.split(' ')[1];
	if (key !== API_KEY) return c.text('Unauthorized', 401);

	const id = c.req.param('id');

	const urlResult = await DB.prepare(`SELECT original_url FROM urls WHERE id = ?`).bind(id).first<{ original_url: string }>();

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
		original_url: urlResult?.original_url || null,
		click_count: result.results.length,
		analytics: result.results,
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

export default app;
