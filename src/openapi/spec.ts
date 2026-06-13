import type { SwaggerUIOptions } from '@hono/swagger-ui';

export const spec: SwaggerUIOptions['spec'] = {
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
					'Generate a shortened URL for the original URL provided in the JSON body. Optionally pass a custom ID and/or an expiry.',
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
										description: 'The original http/https URL to shorten.',
										example: 'https://www.example.com',
									},
									custom_id: {
										type: 'string',
										description: 'Optional custom ID (1-64 chars, [a-zA-Z0-9_-], not a reserved word).',
										example: 'my-short-url',
									},
									expires_in: {
										type: 'integer',
										description: 'Optional. Seconds until the link expires.',
										example: 86400,
									},
									expires_at: {
										type: 'string',
										description: 'Optional. ISO timestamp (or epoch ms) at which the link expires. Ignored if expires_in is set.',
										example: '2026-12-31T23:59:59Z',
									},
								},
								required: ['url'],
							},
						},
					},
				},
				responses: {
					201: {
						description: 'Short URL created',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										short_url: { type: 'string', example: 'https://short.procd.cc/my-short-url' },
										id: { type: 'string', example: 'my-short-url' },
										expires_at: { type: 'string', nullable: true, format: 'date-time' },
										existing: { type: 'boolean', example: false },
									},
								},
							},
						},
					},
					200: { description: 'An existing short URL was returned for this original URL (dedup).' },
					400: { description: 'Invalid url / custom_id / expiry' },
					409: { description: 'Conflict — Custom ID already in use' },
					429: { description: 'Rate limit exceeded' },
					500: { description: 'Internal server error' },
				},
			},
		},
		'/{id}': {
			get: {
				summary: 'Resolve a short URL',
				description: 'Redirects (302) to the original URL and records a click. Returns 410 if the link expired or is inactive.',
				tags: ['URL Shortener'],
				parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
				responses: {
					302: { description: 'Redirect to the original URL' },
					404: { description: 'Unknown short code' },
					410: { description: 'Link expired or inactive' },
				},
			},
		},
		'/analytics': {
			get: {
				summary: 'Get analytics summary',
				description:
					'Fetch analytics data, including click counts, first/last clicked timestamps, referrers, and country codes. Paginate via `page` and `limit`.',
				tags: ['Analytics'],
				security: [{ bearerAuth: [] }],
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
										total: { type: 'integer', description: 'Total number of unique short links (short_id)' },
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
					401: { description: 'Unauthorized - Invalid API key' },
				},
			},
			delete: {
				summary: 'Delete analytics and short URLs',
				description: 'Delete all analytics records and associated short URLs for the given list of short IDs. Requires a valid API key.',
				tags: ['Analytics'],
				security: [{ bearerAuth: [] }],
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
								example: { ids: ['abc123', 'xyz789'] },
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
										ids: { type: 'array', items: { type: 'string' }, description: 'IDs that were deleted.' },
									},
								},
							},
						},
					},
					400: { description: 'Invalid request body — `ids` is missing or empty.' },
					401: { description: 'Unauthorized — Invalid API key.' },
				},
			},
		},
		'/analytics/{id}': {
			get: {
				summary: 'Get full analytics for a short URL',
				description: 'Retrieve detailed analytics for a specific shortened URL, including click data, referrers, user agents, and country codes.',
				tags: ['Analytics'],
				security: [{ bearerAuth: [] }],
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
										original_url: { type: 'string', nullable: true },
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
					401: { description: 'Unauthorized - Invalid API key' },
				},
			},
		},
	},
	components: {
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
			},
		},
	},
	tags: [
		{ name: 'URL Shortener', description: 'Endpoints for creating and resolving short URLs.' },
		{ name: 'Analytics', description: 'Endpoints for fetching analytics related to the shortened URLs.' },
	],
};
