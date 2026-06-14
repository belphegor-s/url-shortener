import type { D1Migration } from '@cloudflare/vitest-pool-workers/config';

declare module 'cloudflare:test' {
	interface ProvidedEnv {
		DB: D1Database;
		API_KEY: string;
		ADMIN_USERNAME: string;
		ADMIN_PASSWORD: string;
		LINKS_KV: KVNamespace;
		TEST_MIGRATIONS: D1Migration[];
		SHORT_DOMAIN?: string;
		ALLOWED_ORIGINS?: string;
	}
}
