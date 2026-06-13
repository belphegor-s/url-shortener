/** Accept only http(s) URLs — blocks javascript:, data:, file: and other open-redirect vectors. */
export const isValidUrl = (url: string): boolean => {
	try {
		const u = new URL(url);
		return u.protocol === 'http:' || u.protocol === 'https:';
	} catch {
		return false;
	}
};

/**
 * Resolve an expiry from a create request into epoch millis (or null = never).
 * Accepts `expires_in` (seconds from now) or `expires_at` (ISO string / epoch ms).
 * Returns `undefined` when the input is present but invalid.
 */
export const resolveExpiry = (body: { expires_in?: unknown; expires_at?: unknown }): number | null | undefined => {
	const { expires_in, expires_at } = body;

	if (expires_in != null) {
		const secs = Number(expires_in);
		if (!Number.isFinite(secs) || secs <= 0) return undefined;
		return Date.now() + secs * 1000;
	}

	if (expires_at != null) {
		const ms = typeof expires_at === 'number' ? expires_at : Date.parse(String(expires_at));
		if (!Number.isFinite(ms) || ms <= Date.now()) return undefined;
		return ms;
	}

	return null;
};
