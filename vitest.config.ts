import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config';
import path from 'node:path';

export default defineWorkersConfig(async () => {
	// Load migrations so the test setup file can apply them to the isolated D1 instance.
	const migrations = await readD1Migrations(path.join(__dirname, 'migrations'));

	return {
		test: {
			setupFiles: ['./test/apply-migrations.ts'],
			poolOptions: {
				workers: {
					singleWorker: true,
					wrangler: { configPath: './wrangler.jsonc' },
					miniflare: {
						// Test-only bindings (unsafe ratelimit binding is not simulated; the route fails open).
						bindings: {
							API_KEY: 'test-secret',
							ADMIN_USERNAME: 'ayush',
							ADMIN_PASSWORD: 'test-password',
							TEST_MIGRATIONS: migrations,
						},
					},
				},
			},
		},
	};
});
