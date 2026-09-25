import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useDebounced<T>(value: T, ms = 300): T {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
}

/**
 * Filter state backed by the URL query string, so views survive reloads and can be shared.
 * `defaults` must be a stable (module-level) object. Values equal to their default are
 * dropped from the URL, and any change that doesn't set `page` resets it to the first page.
 */
export function useFilters<T extends Record<string, string>>(defaults: T) {
	const [params, setParams] = useSearchParams();
	const values = Object.fromEntries(Object.keys(defaults).map((k) => [k, params.get(k) ?? defaults[k]])) as T;

	const set = useCallback(
		(patch: Partial<T>, opts?: { replace?: boolean }) =>
			setParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					if (!('page' in patch)) next.delete('page');
					for (const [k, v] of Object.entries(patch)) {
						if (v === undefined || v === '' || v === defaults[k]) next.delete(k);
						else next.set(k, v);
					}
					return next;
				},
				{ replace: opts?.replace },
			),
		[setParams, defaults],
	);

	return [values, set] as const;
}

/** Search box state: typed locally, debounced into the `q` param, and resynced on back/forward. */
export function useSearchFilter(q: string, setQ: (q: string) => void) {
	const [search, setSearch] = useState(q);
	const debounced = useDebounced(search);

	useEffect(() => {
		if (debounced !== q) setQ(debounced);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounced]);
	useEffect(() => setSearch(q), [q]);

	return [search, setSearch] as const;
}

export const toPage = (v: string) => Math.max(1, Number.parseInt(v, 10) || 1);
