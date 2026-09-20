import type { User } from '../types';
import { icon } from './icons';
import { styles } from './styles';

/** HTML-escape untrusted values interpolated into the page. */
const esc = (value: unknown): string =>
	String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

export interface LandingOptions {
	/** Request origin, e.g. https://short.procd.cc */
	origin: string;
	/** Public base used to display short URLs. */
	baseUrl: string;
	/** Signed-in user, or null. */
	user: User | null;
	/** Synchronizer CSRF token, present when signed in. */
	csrf?: string;
	/** Optional auth error code to surface. */
	authError?: string;
	/** GitHub repository URL for the source link. */
	repoUrl?: string;
}

const AUTH_ERRORS: Record<string, string> = {
	denied: 'GitHub sign-in was cancelled.',
	state: 'That sign-in link expired or was already used. Please try again.',
	exchange: 'We could not complete GitHub sign-in. Please try again.',
};

const TITLE = 'SHRT — Short links, long reach';
const DESCRIPTION =
	'SHRT is a blazing-fast URL shortener with edge redirects, custom codes, link expiry, and privacy-friendly click analytics. Sign in with GitHub and start shortening in seconds.';

export function renderLanding(o: LandingOptions): string {
	const authed = !!o.user;
	const repo = o.repoUrl ?? 'https://github.com/belphegor-s/url-shortener';
	const errorMsg = o.authError ? AUTH_ERRORS[o.authError] ?? 'Sign-in failed. Please try again.' : null;

	const accountButton = authed
		? `<a class="btn btn-primary btn-sm" href="/dashboard">Dashboard ${icon('arrow', { size: 16 })}</a>
		   ${o.user?.avatarUrl ? `<img class="avatar" src="${esc(o.user.avatarUrl)}" alt="" width="30" height="30" referrerpolicy="no-referrer" />` : ''}`
		: `<a class="btn btn-sm" href="/auth/github">${icon('github', { size: 16, filled: true })} Sign in</a>`;

	const shortenButton = authed
		? `<button class="btn btn-primary" type="submit">Shorten ${icon('arrow', { size: 17 })}</button>`
		: `<button class="btn btn-primary" type="submit">${icon('github', { size: 17, filled: true })} Continue with GitHub</button>`;

	const shortenHint = authed
		? `${icon('check', { size: 14 })} Signed in as <strong>@${esc(o.user?.login)}</strong> · your links stay private to your account`
		: `${icon('lock', { size: 14 })} Free with GitHub · no password, no email, no tracking beyond link analytics`;

	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'SHRT',
		applicationCategory: 'UtilitiesApplication',
		operatingSystem: 'Web',
		description: DESCRIPTION,
		url: o.origin,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
	});

	return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESCRIPTION)}" />
<link rel="canonical" href="${esc(o.origin)}/" />
<meta name="robots" content="index, follow" />
<meta name="theme-color" content="#060608" media="(prefers-color-scheme: dark)" />
<meta name="theme-color" content="#fbfbfe" media="(prefers-color-scheme: light)" />
<meta name="color-scheme" content="dark light" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="SHRT" />
<meta property="og:title" content="${esc(TITLE)}" />
<meta property="og:description" content="${esc(DESCRIPTION)}" />
<meta property="og:url" content="${esc(o.origin)}/" />
<meta property="og:image" content="${esc(o.origin)}/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="SHRT — Short links, long reach." />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(TITLE)}" />
<meta name="twitter:description" content="${esc(DESCRIPTION)}" />
<meta name="twitter:image" content="${esc(o.origin)}/og.png" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<script type="application/ld+json">${jsonLd}</script>
<script src="/landing.js"></script>
<style>${styles}</style>
</head>
<body data-authed="${authed ? 'true' : 'false'}" data-csrf="${esc(o.csrf ?? '')}">
<div class="backdrop"><span class="glow glow-a"></span><span class="glow glow-b"></span><span class="glow glow-c"></span></div>

<header class="nav" id="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="/">
      <span class="logo">${icon('link', { size: 18 })}</span>
      <span class="word">SHRT</span>
      <span class="tag hide-sm">url shortener</span>
    </a>
    <nav class="links" aria-label="Primary">
      <a href="#features">Features</a>
      <a href="#how">How it works</a>
      <a href="#analytics">Analytics</a>
      <a href="/docs">API docs</a>
    </nav>
    <div class="nav-actions">
      <button class="btn btn-ghost btn-icon" id="theme-toggle" type="button" aria-label="Toggle theme" title="Toggle theme">
        <span class="hide-dark">${icon('moon', { size: 18 })}</span>
        <span class="hide-light">${icon('sun', { size: 18 })}</span>
      </button>
      ${accountButton}
    </div>
  </div>
</header>

<main>
  <section class="hero wrap" style="padding-bottom:24px">
    <span class="eyebrow"><span class="dot">${icon('spark', { size: 11 })}</span> Edge-native · runs on Cloudflare Workers</span>
    <h1 class="title">Short links,<br /><span class="grad">long reach.</span></h1>
    <p class="lede">SHRT turns sprawling URLs into crisp, shareable links — served from 300+ edge locations with per-click analytics that respect your visitors. Sign in with GitHub and shorten your first link in seconds.</p>

    ${errorMsg ? `<div class="auth-error">${esc(errorMsg)}</div>` : ''}

    <form class="shorten" id="shorten" novalidate>
      <div class="shorten-row">
        <label class="shorten-input">
          ${icon('link', { size: 18 })}
          <input id="url" name="url" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="Paste a long URL, e.g. https://example.com/very/long/path" aria-label="URL to shorten" required />
        </label>
        ${shortenButton}
      </div>
      <div class="shorten-hint">${shortenHint}</div>
      <div class="auth-error" id="form-error" role="alert" hidden></div>
      <div class="result" id="result" role="status" aria-live="polite">
        <a id="result-link" href="#" target="_blank" rel="noreferrer"></a>
        <button class="btn btn-sm copy" type="button" id="copy-btn" data-copy="">${icon('copy', { size: 15 })} Copy</button>
      </div>
    </form>
  </section>

  <section id="features" class="wrap">
    <div class="sec-head">
      <div class="kicker">Everything you need</div>
      <h2>Built for links that actually go places.</h2>
      <p>No bloated dashboards, no tracking scripts. Just fast redirects and the numbers that tell you what's working.</p>
    </div>
    <div class="cards">
      ${featureCard('bolt', 'Edge-fast redirects', 'Every short link resolves at the nearest Cloudflare edge location, with a read-through KV cache so the hot path never waits on the database.')}
      ${featureCard('chart', 'Click analytics', 'Clicks, countries, referrers, devices and a 30-day trend — per link and across your account.')}
      ${featureCard('link', 'Custom short codes', 'Claim memorable slugs like <code>/launch</code> or <code>/me</code>. Reserved routes are always protected.')}
      ${featureCard('clock', 'Expiring links', 'Set a link to expire after a set time. Expired links return a clean 410 Gone instead of a dead redirect.')}
      ${featureCard('github', 'GitHub sign-in', 'One click with GitHub — no passwords to forget. Your links are private to your account.')}
      ${featureCard('code', 'Open API', 'Create and manage links programmatically with a bearer token. Interactive docs are always a click away.')}
    </div>
  </section>

  <section id="how" class="wrap">
    <div class="sec-head">
      <div class="kicker">How it works</div>
      <h2>Three steps. About ten seconds.</h2>
    </div>
    <div class="steps">
      <div class="step"><div class="n">1</div><h3>Sign in with GitHub</h3><p>Authenticate in one click. We only read your public profile and primary email — nothing else.</p></div>
      <div class="step"><div class="n">2</div><h3>Paste your URL</h3><p>Drop in any http(s) link and optionally claim a custom code or set an expiry.</p></div>
      <div class="step"><div class="n">3</div><h3>Share and measure</h3><p>Send your short link anywhere. Watch clicks, countries and referrers roll in live.</p></div>
    </div>
  </section>

  <section id="analytics" class="wrap">
    <div class="split">
      <div class="prose">
        <div class="kicker">Analytics that respect people</div>
        <h2>Know what works — without spying on anyone.</h2>
        <p>SHRT records the essentials for understanding traffic, never more. Data stays in your own Cloudflare account, on your own database.</p>
        <ul class="checks">
          <li><span class="tick">${icon('check', { size: 12 })}</span> Per-link clicks with first &amp; last seen</li>
          <li><span class="tick">${icon('check', { size: 12 })}</span> Country and referrer breakdowns</li>
          <li><span class="tick">${icon('check', { size: 12 })}</span> 30-day click trend, per link or account-wide</li>
          <li><span class="tick">${icon('check', { size: 12 })}</span> Session control — revoke any device instantly</li>
        </ul>
      </div>
      <div class="code-wrap">
        <div class="code-top"><span class="b"></span><span class="b"></span><span class="b"></span><span class="name">create-link.sh</span><button class="btn btn-sm copy" type="button" data-copy="curl -X POST ${esc(o.baseUrl)}/create -H &quot;Authorization: Bearer $SHRT_API_KEY&quot; -H &quot;content-type: application/json&quot; -d '{&quot;url&quot;:&quot;https://example.com&quot;}'">${icon('copy', { size: 14 })} Copy</button></div>
        <pre class="code"><span class="c"># Programmatic access with your account API key</span>
<span class="f">curl</span> -X POST <span class="s">${esc(o.baseUrl)}/create</span> \\
  -H <span class="s">"Authorization: Bearer $SHRT_API_KEY"</span> \\
  -H <span class="s">"content-type: application/json"</span> \\
  -d <span class="s">'{"url":"https://example.com"}'</span>

<span class="c"># → 201 Created</span>
{
  <span class="k">"short_url"</span>: <span class="s">"${esc(o.baseUrl)}/aB3xK9q"</span>,
  <span class="k">"id"</span>: <span class="s">"aB3xK9q"</span>
}</pre>
      </div>
    </div>
  </section>

  <section class="wrap">
    <div class="stats">
      <div class="stat"><div class="v"><span class="u">300+</span></div><div class="l">edge locations serving redirects</div></div>
      <div class="stat"><div class="v">&lt;30<span class="u">ms</span></div><div class="l">typical warm redirect latency</div></div>
      <div class="stat"><div class="v"><span class="u">100%</span></div><div class="l">self-hosted on your Cloudflare account</div></div>
      <div class="stat"><div class="v"><span class="u">0</span></div><div class="l">tracking scripts or third-party pixels</div></div>
    </div>
  </section>

  <section class="wrap">
    <div class="cta">
      <h2>Ready to make every link count?</h2>
      <p>Sign in with GitHub and create your first short link in seconds. Free, fast, and yours.</p>
      <div class="row">
        <a class="btn btn-primary" href="${authed ? '/dashboard' : '/auth/github'}">${icon('github', { size: 18, filled: true })} ${authed ? 'Open dashboard' : 'Get started with GitHub'}</a>
        <a class="btn" href="/docs">${icon('code', { size: 17 })} Read the API docs</a>
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="wrap foot">
    <div class="brand"><span class="logo">${icon('link', { size: 18 })}</span><span><span class="word">SHRT</span><span class="tag">url shortener</span></span></div>
    <div class="foot-links">
      <a href="#features">Features</a>
      <a href="/docs">API docs</a>
      <a href="${esc(repo)}" target="_blank" rel="noreferrer">Source</a>
      <a href="/dashboard">Dashboard</a>
    </div>
    <p>© ${new Date().getFullYear()} SHRT · Built on Cloudflare Workers, D1 &amp; KV.</p>
  </div>
</footer>
</body>
</html>`;
}

function featureCard(name: Parameters<typeof icon>[0], title: string, body: string): string {
	return `<div class="card"><div class="ico">${icon(name, { size: 20 })}</div><h3>${title}</h3><p>${body}</p></div>`;
}
