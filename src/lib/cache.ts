import type { Bindings, CachedLink } from '../types';

/** KV entry TTL — long enough to stay hot, short enough that drift self-heals. */
const KV_TTL_SECONDS = 60 * 60; // 1h
/** Edge cacheTtl for KV reads (fast warm hits within a colo). */
const KV_CACHE_TTL = 300;

/** Read a cached link. Returns null on miss. */
export const getLink = (env: Bindings, id: string): Promise<CachedLink | null> =>
	env.LINKS_KV.get<CachedLink>(id, { type: 'json', cacheTtl: KV_CACHE_TTL });

/** Populate / refresh a cached link. */
export const putLink = (env: Bindings, id: string, link: CachedLink): Promise<void> =>
	env.LINKS_KV.put(id, JSON.stringify(link), { expirationTtl: KV_TTL_SECONDS });

/** Evict a cached link (on delete or detected expiry). */
export const purgeLink = (env: Bindings, id: string): Promise<void> => env.LINKS_KV.delete(id);
