import type { D1Migration } from '@cloudflare/vitest-pool-workers/config';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		DB: D1Database;
		GITHUB_CLIENT_ID: string;
		GITHUB_CLIENT_SECRET: string;
		ADMIN_GITHUB_LOGIN: string;
		ADMIN_GITHUB_EMAIL: string;
		LINKS_KV: KVNamespace;
		TEST_MIGRATIONS: D1Migration[];
		SHORT_DOMAIN?: string;
		ALLOWED_ORIGINS?: string;
	}
}
