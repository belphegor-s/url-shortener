import type { User } from '../types';
import { esc, renderPage, REPO_URL, type NavLink } from './chrome';
import { docsStyles } from './docs-styles';
import { icon } from './icons';

export interface DocsOptions {
	origin: string;
	baseUrl: string;
	user: User | null;
	csrf?: string;
}

const TITLE = 'API reference — SHRT';
const DESCRIPTION =
	'Reference for the SHRT HTTP API: create short links, resolve them, and read per-link click analytics with a per-account API key.';

const NAV: NavLink[] = [
	{ href: '/#features', label: 'Features' },
	{ href: '/#how-it-works', label: 'How it works' },
	{ href: '/#analytics', label: 'Analytics' },
	{ href: '/docs', label: 'API docs' },
];

const SECTIONS: Array<{ id: string; label: string }> = [
	{ id: 'introduction', label: 'Introduction' },
	{ id: 'authentication', label: 'Authentication' },
	{ id: 'errors', label: 'Errors and limits' },
	{ id: 'create-link', label: 'Create a link' },
	{ id: 'resolve-link', label: 'Resolve a link' },
	{ id: 'list-analytics', label: 'List analytics' },
	{ id: 'link-analytics', label: 'Link analytics' },
	{ id: 'delete-links', label: 'Delete links' },
	{ id: 'openapi', label: 'OpenAPI spec' },
];

type Row = [name: string, type: string, required: boolean, description: string];

export function renderDocs(o: DocsOptions): string {
	const base = o.baseUrl;

	const content = `<main class="container docs rule">
  <aside class="docs-nav" id="docs-nav">
    <h4>On this page</h4>
    <ul>
      ${SECTIONS.map((s) => `<li><a href="#${s.id}" data-docs-link="${s.id}">${esc(s.label)}</a></li>`).join('\n      ')}
    </ul>
  </aside>

  <div class="docs-main">
    <section id="introduction">
      <p class="eyebrow">API reference</p>
      <h1 style="margin-top:0.75rem">SHRT HTTP API</h1>
      <p>Create short links and read their analytics over plain HTTP. Every request and response is JSON, every endpoint is scoped to the authenticated account, and the whole thing is open source.</p>
      <div class="docs-cards" style="margin-top:1.5rem">
        <div class="feature">
          <div class="icon">${icon('globe', { size: 17 })}</div>
          <h3>Base URL</h3>
          <p style="font-family:'JetBrains Mono',ui-monospace,monospace;color:var(--foreground)">${esc(base)}</p>
        </div>
        <div class="feature">
          <div class="icon">${icon('layers', { size: 17 })}</div>
          <h3>Content type</h3>
          <p>Send <code>content-type: application/json</code> on requests with a body. Responses are always JSON, apart from the redirect itself.</p>
        </div>
      </div>
    </section>

    <section id="authentication">
      <h2>Authentication</h2>
      <p>There is no global API key. Create a per-account key in the dashboard under <strong>API keys</strong>, then send it as a bearer token. Keys are scoped to the account that created them and can be revoked at any time.</p>
      ${codeBlock('authorization', `Authorization: Bearer shrt_live_xxxxxxxxxxxxxxxxxxxx`)}
      <p>Browser requests from a signed-in session work too: the session cookie authenticates <code>/create</code> and <code>/analytics</code> without a key. Account admins may additionally pass <code>?scope=all</code> to read across every account.</p>
      <div class="card" style="padding:0.875rem 1rem;margin-top:1rem;display:flex;gap:0.625rem;align-items:flex-start">
        <span style="color:var(--muted-foreground);flex:none;margin-top:0.125rem">${icon('lock', { size: 15 })}</span>
        <p style="font-size:0.875rem">A key is shown once, at creation. Store it in a secret manager, not in source control.</p>
      </div>
    </section>

    <section id="errors">
      <h2>Errors and limits</h2>
      <p>Errors use conventional HTTP status codes and a consistent body shape.</p>
      ${codeBlock('error.json', `{\n  "error": "Invalid or missing URL",\n  "code": "bad_request"\n}`)}
      ${table(
				['Status', 'Code', 'Meaning'],
				[
					['400', '<code>bad_request</code>', 'Malformed JSON, missing URL, bad custom id, or an expiry in the past.'],
					['401', '<code>unauthorized</code>', 'Missing, malformed or revoked credentials.'],
					['404', '<code>not_found</code>', 'Unknown short code, or a link owned by another account.'],
					['409', '<code>conflict</code>', 'The requested custom id is already taken or reserved.'],
					['410', '<code>gone</code>', 'The link expired or was deactivated.'],
					['429', '<code>rate_limited</code>', 'Too many requests from this IP.'],
					['500', '<code>internal_error</code>', 'Unexpected server error.'],
				]
			)}
      <p><code>POST /create</code> is rate limited to 20 requests per minute per IP, and the sign-in hop to 5 per minute. Redirects are not rate limited.</p>
    </section>

    ${endpoint({
			method: 'POST',
			path: '/create',
			auth: 'API key or session',
			summary: 'Create a short link for a URL. Passing the same URL again returns the existing link with status 200 instead of creating a duplicate.',
			params: [
				['url', 'string', true, 'The http or https URL to shorten.'],
				['custom_id', 'string', false, 'Preferred short code. 1 to 64 characters from <code>a-zA-Z0-9_-</code>, and not a reserved route.'],
				['expires_in', 'integer', false, 'Seconds from now until the link expires.'],
				['expires_at', 'string | integer', false, 'Absolute expiry as an ISO 8601 timestamp or epoch milliseconds. Ignored when <code>expires_in</code> is set.'],
			],
			request: `curl -X POST ${base}/create \\\n  -H "Authorization: Bearer $SHRT_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{\n        "url": "https://example.com/a/very/long/path",\n        "custom_id": "launch",\n        "expires_in": 86400\n      }'`,
			response: `{\n  "short_url": "${base}/launch",\n  "id": "launch",\n  "expires_at": "2026-01-01T00:00:00.000Z",\n  "existing": false\n}`,
			responseLabel: '201 Created',
			id: 'create-link',
		})}

    ${endpoint({
			method: 'GET',
			path: '/:id',
			auth: 'Public',
			summary:
				'Resolve a short code. Responds with a 302 to the original URL and records the click out of band, so the redirect never waits on the write. Unknown codes return 404, expired or deactivated ones return 410.',
			request: `curl -i ${base}/launch`,
			response: `HTTP/2 302\nlocation: https://example.com/a/very/long/path\ncache-control: private, no-store`,
			responseLabel: '302 Found',
			id: 'resolve-link',
		})}

    ${endpoint({
			method: 'GET',
			path: '/analytics',
			auth: 'API key or session',
			summary: 'Paginated click summary, one row per short link owned by the caller, ordered by the most recent click.',
			paramsTitle: 'Query parameters',
			params: [
				['page', 'integer', false, 'Page number, starting at 1. Default <code>1</code>.'],
				['limit', 'integer', false, 'Rows per page, 1 to 500. Default <code>50</code>.'],
				['sort', 'string', false, '<code>asc</code> or <code>desc</code> by last click. Default <code>desc</code>.'],
				['scope', 'string', false, 'Admins only. <code>all</code> returns every account.'],
			],
			request: `curl "${base}/analytics?page=1&limit=20" \\\n  -H "Authorization: Bearer $SHRT_API_KEY"`,
			response: `{\n  "scope": "mine",\n  "page": 1,\n  "limit": 20,\n  "sort": "desc",\n  "total": 3,\n  "data": [\n    {\n      "short_id": "launch",\n      "original_url": "https://example.com/a/very/long/path",\n      "click_count": 128,\n      "first_clicked": "2026-01-01T09:12:44.000Z",\n      "last_clicked": "2026-01-08T17:02:10.000Z",\n      "latest_referrer": "https://news.ycombinator.com/",\n      "country_code": "IN"\n    }\n  ]\n}`,
			responseLabel: '200 OK',
			id: 'list-analytics',
		})}

    ${endpoint({
			method: 'GET',
			path: '/analytics/:id',
			auth: 'API key or session',
			summary: 'Full click log for a single short link, most recent first, capped at 1000 rows. Links owned by another account return 404.',
			request: `curl ${base}/analytics/launch \\\n  -H "Authorization: Bearer $SHRT_API_KEY"`,
			response: `{\n  "id": "launch",\n  "original_url": "https://example.com/a/very/long/path",\n  "click_count": 2,\n  "analytics": [\n    {\n      "timestamp": "2026-01-08T17:02:10.000Z",\n      "ip": "203.0.113.4",\n      "user_agent": "Mozilla/5.0 ...",\n      "referrer": "https://news.ycombinator.com/",\n      "country_code": "IN"\n    }\n  ]\n}`,
			responseLabel: '200 OK',
			id: 'link-analytics',
		})}

    ${endpoint({
			method: 'DELETE',
			path: '/analytics',
			auth: 'API key or session',
			summary:
				'Permanently delete links and their recorded clicks, and evict them from the edge cache. Ids that the caller does not own are silently skipped, and the response lists exactly what was removed.',
			params: [['ids', 'string[]', true, 'Short codes to delete. Must contain at least one id.']],
			request: `curl -X DELETE ${base}/analytics \\\n  -H "Authorization: Bearer $SHRT_API_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{"ids":["launch","aB3xK9q"]}'`,
			response: `{\n  "success": true,\n  "ids": ["launch", "aB3xK9q"]\n}`,
			responseLabel: '200 OK',
			id: 'delete-links',
		})}

    <section id="openapi">
      <h2>OpenAPI spec</h2>
      <p>The machine-readable description of this API is served as OpenAPI 3.1. Point your client generator, Postman or Insomnia at it directly.</p>
      ${codeBlock('openapi', `curl ${base}/openapi.json`)}
      <div style="display:flex;flex-wrap:wrap;gap:0.625rem;margin-top:1.25rem">
        <a class="btn btn-outline btn-sm" href="/openapi.json">${icon('code', { size: 15 })} Open the spec</a>
        <a class="btn btn-outline btn-sm" href="${esc(REPO_URL)}" target="_blank" rel="noreferrer noopener">${icon('github', { size: 15, filled: true })} Source on GitHub ${icon('external', { size: 13 })}</a>
      </div>
    </section>
  </div>
</main>`;

	return renderPage({
		origin: o.origin,
		user: o.user,
		csrf: o.csrf,
		title: TITLE,
		description: DESCRIPTION,
		canonical: `${o.origin}/docs`,
		nav: NAV,
		content,
		extraCss: docsStyles,
		bodyAttrs: `data-authed="${o.user ? 'true' : 'false'}"`,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'TechArticle',
			headline: 'SHRT HTTP API reference',
			description: DESCRIPTION,
			url: `${o.origin}/docs`,
		},
	});
}

interface EndpointOptions {
	id: string;
	method: 'GET' | 'POST' | 'DELETE';
	path: string;
	auth: string;
	summary: string;
	paramsTitle?: string;
	params?: Row[];
	request: string;
	response: string;
	responseLabel: string;
}

function endpoint(e: EndpointOptions): string {
	return `<section id="${e.id}">
      <div class="card endpoint">
        <div class="endpoint-head">
          <span class="method method-${e.method.toLowerCase()}">${e.method}</span>
          <span class="path">${esc(e.path)}</span>
          <span class="auth">${esc(e.auth)}</span>
        </div>
        <div class="endpoint-body">
          <p>${e.summary}</p>
          ${e.params ? `<div><h3>${esc(e.paramsTitle ?? 'Body parameters')}</h3>${table(['Field', 'Type', 'Description'], e.params.map(paramRow), '0.625rem')}</div>` : ''}
          <div><h3>Request</h3>${codeBlock('request', e.request, '0.625rem')}</div>
          <div><h3>Response &middot; ${esc(e.responseLabel)}</h3>${codeBlock('response', e.response, '0.625rem')}</div>
        </div>
      </div>
    </section>`;
}

const paramRow = ([name, type, required, description]: Row): string[] => [
	`<code>${esc(name)}</code>${required ? '<span class="req">required</span>' : ''}`,
	`<span style="color:var(--subtle-foreground)">${esc(type)}</span>`,
	description,
];

function table(head: string[], rows: string[][], marginTop = '1rem'): string {
	return `<div class="table-wrap" style="margin-top:${marginTop}">
            <table>
              <thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
              <tbody>${rows.map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>`;
}

function codeBlock(name: string, code: string, marginTop = '1rem'): string {
	return `<div class="card code-card" style="margin-top:${marginTop}">
            <div class="code-head">
              ${icon('terminal', { size: 15 })}
              <span class="name">${esc(name)}</span>
              <button class="btn btn-ghost btn-sm" type="button" data-copy="${esc(code)}">${icon('copy', { size: 14 })} <span>Copy</span></button>
            </div>
            <pre class="code">${esc(code)}</pre>
          </div>`;
}
