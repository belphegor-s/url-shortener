import type { Bindings } from '../types';

/** Narrow a list of short ids down to those owned by `userId`. */
export async function filterOwnedIds(env: Bindings, userId: string, ids: string[]): Promise<string[]> {
	if (ids.length === 0) return [];
	const placeholders = ids.map(() => '?').join(',');
	const { results } = await env.DB.prepare(`SELECT id FROM urls WHERE id IN (${placeholders}) AND user_id = ?`)
		.bind(...ids, userId)
		.all<{ id: string }>();
	return results.map((r) => r.id);
}
