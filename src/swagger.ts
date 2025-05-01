export const swaggerSpec = {
	openapi: '3.0.0',
	info: {
		title: 'URL Shortener API',
		version: '1.0.0',
		description: 'API documentation for the URL shortener service with analytics and redirection.',
	},
	servers: [
		{
			url: 'https://url-shortner.ayush2162002.workers.dev',
		},
	],
	paths: {
		'/create': {
			post: {
				summary: 'Create a new short URL',
				requestBody: {
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									url: {
										type: 'string',
										description: 'The original URL to shorten',
									},
									custom_id: {
										type: 'string',
										description: 'An optional custom ID for the short URL',
									},
								},
								required: ['url'],
							},
						},
					},
				},
				responses: {
					200: {
						description: 'Short URL created successfully',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										short_url: {
											type: 'string',
										},
										existing: {
											type: 'boolean',
										},
										created: {
											type: 'boolean',
										},
									},
								},
							},
						},
					},
					400: {
						description: 'Missing URL in the request',
					},
					409: {
						description: 'Conflict or error during URL creation',
					},
				},
			},
		},
		'/analytics': {
			get: {
				summary: 'Get analytics data for all short URLs',
				parameters: [
					{
						in: 'query',
						name: 'page',
						required: false,
						schema: {
							type: 'integer',
							default: 1,
						},
					},
					{
						in: 'query',
						name: 'limit',
						required: false,
						schema: {
							type: 'integer',
							default: 50,
						},
					},
					{
						in: 'query',
						name: 'sort',
						required: false,
						schema: {
							type: 'string',
							default: 'desc',
						},
					},
				],
				responses: {
					200: {
						description: 'Paginated analytics data',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										page: {
											type: 'integer',
										},
										limit: {
											type: 'integer',
										},
										data: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													short_id: {
														type: 'string',
													},
													click_count: {
														type: 'integer',
													},
													last_clicked: {
														type: 'string',
													},
													first_clicked: {
														type: 'string',
													},
													latest_referrer: {
														type: 'string',
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
		'/:id': {
			get: {
				summary: 'Redirect to the original URL from the short URL',
				parameters: [
					{
						in: 'path',
						name: 'id',
						required: true,
						description: 'The short URL identifier',
						schema: {
							type: 'string',
						},
					},
				],
				responses: {
					302: {
						description: 'Redirect to original URL',
					},
					404: {
						description: 'URL not found',
					},
				},
			},
		},
		'/analytics/{id}': {
			get: {
				summary: 'Get detailed analytics for a specific short URL',
				parameters: [
					{
						in: 'path',
						name: 'id',
						required: true,
						description: 'The short URL identifier',
						schema: {
							type: 'string',
						},
					},
				],
				responses: {
					200: {
						description: 'Detailed analytics data for a specific short URL',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										id: {
											type: 'string',
										},
										click_count: {
											type: 'integer',
										},
										analytics: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													timestamp: {
														type: 'string',
													},
													ip: {
														type: 'string',
													},
													user_agent: {
														type: 'string',
													},
													referrer: {
														type: 'string',
													},
													country_code: {
														type: 'string',
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	},
};
