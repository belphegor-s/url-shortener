/** Compact number, e.g. 12480 -> "12.5K". */
export const compact = (n: number): string => Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/** Full grouped number, e.g. "12,480". */
export const full = (n: number): string => Intl.NumberFormat('en').format(n);

/** ISO/epoch -> "Jun 13, 2026". */
export const fmtDate = (input: string | number | null): string => {
	if (input == null) return '—';
	const d = new Date(typeof input === 'number' ? input : input.replace(' ', 'T') + (typeof input === 'string' && !input.includes('Z') ? 'Z' : ''));
	if (isNaN(d.getTime())) return '—';
	return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Relative time, e.g. "3h ago". */
export const relative = (input: string | number | null): string => {
	if (input == null) return '—';
	const d = new Date(typeof input === 'number' ? input : input.replace(' ', 'T') + (typeof input === 'string' && !input.includes('Z') ? 'Z' : ''));
	const ms = Date.now() - d.getTime();
	if (isNaN(ms)) return '—';
	const s = Math.round(ms / 1000);
	if (s < 60) return 'just now';
	const m = Math.round(s / 60);
	if (m < 60) return `${m}m ago`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h}h ago`;
	const days = Math.round(h / 24);
	if (days < 30) return `${days}d ago`;
	return fmtDate(input);
};

/** Country code -> emoji flag. */
export const flag = (code: string | null): string => {
	if (!code || code.length !== 2) return '🏳️';
	const cc = code.toUpperCase();
	if (cc === 'T1' || cc === 'XX') return '🏴‍☠️';
	return String.fromCodePoint(...[...cc].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
};

/** Hostname of a URL for display. */
export const hostOf = (url: string): string => {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
};

/** Short OS/browser label from a user agent. */
export const uaLabel = (ua: string | null): string => {
	if (!ua) return 'Unknown';
	const browser = /Edg/.test(ua) ? 'Edge' : /OPR|Opera/.test(ua) ? 'Opera' : /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser';
	const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
	return os ? `${browser} · ${os}` : browser;
};
