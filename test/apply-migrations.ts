import { applyD1Migrations, env } from 'cloudflare:test';

// Apply all migrations once before the suite runs, against the isolated test D1.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
