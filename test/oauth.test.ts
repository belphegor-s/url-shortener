import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import { safeReturnTo, createState, consumeState } from '../src/lib/oauth';

describe('safeReturnTo', () => {
	it('allows internal absolute paths', () => {
		expect(safeReturnTo('/links?new=https%3A%2F%2Fx.com')).toBe('/links?new=https%3A%2F%2Fx.com');
		expect(safeReturnTo('/dashboard')).toBe('/dashboard');
	});

	it('rejects open-redirect vectors', () => {
		expect(safeReturnTo('https://evil.com')).toBe('/dashboard');
		expect(safeReturnTo('//evil.com')).toBe('/dashboard');
		expect(safeReturnTo('/\\evil.com')).toBe('/dashboard');
		expect(safeReturnTo(undefined)).toBe('/dashboard');
		expect(safeReturnTo('')).toBe('/dashboard');
	});
});

describe('oauth state', () => {
	it('is single-use', async () => {
		const state = await createState(env, '/links?new=abc');
		expect(await consumeState(env, state)).toBe('/links?new=abc');
		// Replaying the same state fails.
		expect(await consumeState(env, state)).toBeNull();
	});

	it('rejects unknown states', async () => {
		expect(await consumeState(env, 'not-a-real-state')).toBeNull();
		expect(await consumeState(env, undefined)).toBeNull();
	});
});
