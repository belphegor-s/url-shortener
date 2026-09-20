// Tiny typed fetch client for the admin API. Same-origin; the session lives in an
// HttpOnly cookie, and a synchronizer CSRF token is echoed on mutating requests.

const BASE = '/api';

let csrfToken: string | null = null;
export const setCsrf = (token: string | null) => {
	csrfToken = token;
};

export class ApiError extends Error {
	constructor(public status: number, public code: string, message: string) {
		super(message);
	}
}

async function request<T>(path: string, options: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {}): Promise<T> {
	const { method = 'GET', body, query } = options;
	const url = new URL(BASE + path, location.origin);
	if (query) {
		for (const [k, v] of Object.entries(query)) {
			if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
		}
	}

	const headers: Record<string, string> = {};
	const mutating = method !== 'GET' && method !== 'HEAD';
	if (body !== undefined) headers['content-type'] = 'application/json';
	if (mutating && csrfToken) headers['x-csrf-token'] = csrfToken;

	const res = await fetch(url.toString(), {
		method,
		headers,
		credentials: 'include',
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});

	if (res.status === 204) return undefined as T;

	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		throw new ApiError(res.status, (data as { code?: string }).code || 'error', (data as { error?: string }).error || res.statusText);
	}
	return data as T;
}

// ---- Types ----
export interface User {
	id: string;
	githubId: string;
	login: string;
	name: string | null;
	email: string | null;
	avatarUrl: string | null;
	role: 'user' | 'admin';
}
export interface Me {
	user: User;
	csrf: string;
}
export type Scope = 'mine' | 'all';
export interface Overview {
	scope: Scope;
	totals: { links: number; active_links: number; clicks: number; clicks_24h: number; clicks_7d: number };
	series: { day: string; clicks: number }[];
	top_links: { id: string; original_url: string; clicks: number }[];
	top_countries: { country_code: string; clicks: number }[];
	top_referrers: { referrer: string; clicks: number }[];
}
export interface AdminUser {
	id: string;
	github_id: string;
	login: string;
	name: string | null;
	email: string | null;
	avatar_url: string | null;
	role: string;
	created_at: number;
	last_login: number;
	links: number;
	active_links: number;
	clicks: number;
}
export interface LinkRow {
	id: string;
	original_url: string;
	created_at: string;
	expires_at: string | null;
	active: number;
	user_id?: string | null;
	short_url: string;
	click_count: number;
	last_clicked: string | null;
}
export interface LinksResponse {
	scope: Scope;
	page: number;
	limit: number;
	total: number;
	data: LinkRow[];
}
export interface ClickRecord {
	timestamp: string;
	ip: string;
	user_agent: string;
	country_code: string;
	referrer: string;
}
export interface LinkDetail {
	link: { id: string; original_url: string; created_at: string; expires_at: string | null; active: number };
	short_url: string;
	records: ClickRecord[];
	total_records: number;
	page: number;
	limit: number;
	by_country: { country_code: string; clicks: number }[];
	by_referrer: { referrer: string; clicks: number }[];
	series: { day: string; clicks: number }[];
}
export interface ApiKeyRow {
	id: string;
	name: string | null;
	prefix: string;
	created_at: number;
	last_used_at: number | null;
}
export interface ApiKeyCreated extends ApiKeyRow {
	/** The raw key - returned exactly once, at creation. */
	key: string;
}
export interface SessionRow {
	id: string;
	ip: string | null;
	user_agent: string | null;
	country_code: string | null;
	created_at: number;
	last_seen: number;
	expires_at: number;
	current: boolean;
}

// ---- Endpoints ----
export const api = {
	logout: () => request<{ success: boolean }>('/logout', { method: 'POST' }),
	me: () => request<Me>('/me'),
	overview: (scope: Scope = 'mine') => request<Overview>('/overview', { query: { scope } }),
	links: (q: { q?: string; page?: number; limit?: number; sort?: string; dir?: string; scope?: Scope }) => request<LinksResponse>('/links', { query: q }),
	createLink: (body: { url: string; custom_id?: string; expires_in?: number }) =>
		request<{ short_url: string; id: string; existing: boolean }>('/links', { method: 'POST', body }),
	updateLink: (id: string, body: { active?: boolean; expires_at?: string | null }) =>
		request<LinkRow>(`/links/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
	deleteLinks: (ids: string[]) => request<{ success: boolean }>('/links', { method: 'DELETE', body: { ids } }),
	linkDetail: (id: string, q: { q?: string; page?: number; limit?: number }) =>
		request<LinkDetail>(`/links/${encodeURIComponent(id)}`, { query: q }),
	sessions: () => request<{ data: SessionRow[] }>('/sessions'),
	revokeSession: (id: string) => request<{ success: boolean }>(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	keys: () => request<{ data: ApiKeyRow[] }>('/keys'),
	createKey: (name?: string) => request<ApiKeyCreated>('/keys', { method: 'POST', body: { name } }),
	revokeKey: (id: string) => request<{ success: boolean }>(`/keys/${encodeURIComponent(id)}`, { method: 'DELETE' }),
	users: () => request<{ data: AdminUser[] }>('/users'),
};
