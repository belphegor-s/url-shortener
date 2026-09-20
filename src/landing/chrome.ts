import type { User } from '../types';
import { icon } from './icons';
import { styles } from './styles';

/** Canonical source repository. Surfaced in the header, footer and hero. */
export const REPO_URL = 'https://github.com/belphegor-s/url-shortener';

/** HTML-escape untrusted values interpolated into the page. */
export const esc = (value: unknown): string =>
	String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

export interface NavLink {
	href: string;
	label: string;
}

export interface PageOptions {
	/** Request origin, e.g. https://short.procd.cc */
	origin: string;
	/** Signed-in user, or null. */
	user: User | null;
	/** Synchronizer CSRF token, present when signed in. */
	csrf?: string;
	title: string;
	description: string;
	canonical: string;
	nav: NavLink[];
	/** Pre-rendered <main> markup. */
	content: string;
	jsonLd?: unknown;
	/** Page-specific CSS appended after the shared stylesheet. */
	extraCss?: string;
	/** Extra attributes for <body> (e.g. data-authed). */
	bodyAttrs?: string;
}

/** Brand mark: rounded gradient square with the link glyph. */
export const brandMark = (size = 26): string =>
	`<span class="mark" style="width:${size}px;height:${size}px">${icon('link', { size: Math.round(size * 0.58) })}</span>`;

function headerHtml(o: PageOptions): string {
	const authed = !!o.user;
	const nav = o.nav.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('');

	const account = authed
		? `<a class="btn btn-outline btn-sm" href="/dashboard">Dashboard ${icon('arrow', { size: 14 })}</a>` +
			(o.user?.avatarUrl
				? `<img class="avatar" src="${esc(o.user.avatarUrl)}" alt="" width="28" height="28" referrerpolicy="no-referrer" />`
				: '')
		: `<a class="btn btn-primary btn-sm" href="/auth/github">${icon('github', { size: 14, filled: true })} Sign in</a>`;

	const accountMobile = authed
		? `<a class="btn btn-primary" href="/dashboard">Open dashboard</a>`
		: `<a class="btn btn-primary" href="/auth/github">${icon('github', { size: 16, filled: true })} Sign in with GitHub</a>`;

	return `<header class="site-header" id="site-header">
  <div class="container header-inner rule">
    <a class="brand" href="/" aria-label="SHRT home">${brandMark()}<span class="name">SHRT</span></a>
    <nav class="nav-desktop" aria-label="Primary">${nav}</nav>
    <div class="header-actions">
      <a class="btn btn-ghost btn-icon" href="${esc(REPO_URL)}" target="_blank" rel="noreferrer noopener" aria-label="Source on GitHub" title="Source on GitHub">${icon('github', { size: 17, filled: true })}</a>
      <button class="btn btn-ghost btn-icon" id="theme-toggle" type="button" aria-label="Toggle theme" title="Toggle theme">
        <span class="on-light">${icon('moon', { size: 17 })}</span>
        <span class="on-dark">${icon('sun', { size: 17 })}</span>
      </button>
      <span class="nav-auth">${account}</span>
      <button class="menu-btn" id="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
        <span class="menu-open">${icon('menu', { size: 17 })}</span>
        <span class="menu-close" hidden>${icon('close', { size: 17 })}</span>
      </button>
    </div>
  </div>
  <div class="mobile-menu" id="mobile-menu">
    <div class="container rule">
      <nav aria-label="Mobile">${nav}<a href="${esc(REPO_URL)}" target="_blank" rel="noreferrer noopener">Source on GitHub</a></nav>
      <div class="actions">${accountMobile}</div>
    </div>
  </div>
</header>`;
}

function footerHtml(): string {
	return `<footer class="site-footer">
  <div class="container footer-top rule">
    <div>
      <a class="brand" href="/">${brandMark()}<span class="name">SHRT</span></a>
      <p class="blurb">Short links, long reach. An open-source URL shortener with edge redirects and privacy-friendly analytics.</p>
      <a class="btn btn-outline btn-sm" style="margin-top:1rem" href="${esc(REPO_URL)}" target="_blank" rel="noreferrer noopener">${icon('github', { size: 15, filled: true })} View source ${icon('external', { size: 13 })}</a>
    </div>
    <div class="footer-cols">
      <div class="footer-col">
        <h4>Product</h4>
        <a href="/#features">Features</a>
        <a href="/#how-it-works">How it works</a>
        <a href="/#analytics">Analytics</a>
        <a href="/dashboard">Dashboard</a>
      </div>
      <div class="footer-col">
        <h4>Developers</h4>
        <a href="/docs">API reference</a>
        <a href="/docs#authentication">Authentication</a>
        <a href="/openapi.json">OpenAPI spec</a>
        <a href="${esc(REPO_URL)}" target="_blank" rel="noreferrer noopener">Source code</a>
      </div>
      <div class="footer-col">
        <h4>Project</h4>
        <a href="${esc(REPO_URL)}/issues" target="_blank" rel="noreferrer noopener">Report an issue</a>
        <a href="${esc(REPO_URL)}#setup" target="_blank" rel="noreferrer noopener">Self-host</a>
        <a href="${esc(REPO_URL)}/blob/main/LICENSE.md" target="_blank" rel="noreferrer noopener">MIT license</a>
      </div>
    </div>
  </div>
  <div class="container footer-bottom">
    <span>&copy; ${new Date().getFullYear()} SHRT. Open source under MIT.</span>
    <span>Built on Cloudflare Workers, D1 and KV.</span>
  </div>
</footer>`;
}

/** Full document wrapper shared by the landing page and the API reference. */
export function renderPage(o: PageOptions): string {
	return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}" />
<link rel="canonical" href="${esc(o.canonical)}" />
<meta name="robots" content="index, follow" />
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#09090b" media="(prefers-color-scheme: dark)" />
<meta name="color-scheme" content="light dark" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="SHRT" />
<meta property="og:title" content="${esc(o.title)}" />
<meta property="og:description" content="${esc(o.description)}" />
<meta property="og:url" content="${esc(o.canonical)}" />
<meta property="og:image" content="${esc(o.origin)}/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="SHRT. Short links, long reach." />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(o.title)}" />
<meta name="twitter:description" content="${esc(o.description)}" />
<meta name="twitter:image" content="${esc(o.origin)}/og.png" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
${o.jsonLd ? `<script type="application/ld+json">${JSON.stringify(o.jsonLd)}</script>` : ''}
<script src="/landing.js"></script>
<style>${styles}${o.extraCss ?? ''}</style>
</head>
<body${o.bodyAttrs ? ` ${o.bodyAttrs}` : ''}>
${headerHtml(o)}
${o.content}
${footerHtml()}
</body>
</html>`;
}
