import { esc, renderPage, REPO_URL, type NavLink } from './chrome';
import { icon, type IconName } from './icons';

export interface LandingOptions {
	/** Request origin, e.g. https://short.procd.cc */
	origin: string;
	/** Public base used to display short URLs. */
	baseUrl: string;
	/** Signed-in user, or null. */
	user: import('../types').User | null;
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
	'SHRT is an open-source URL shortener on Cloudflare Workers: edge redirects, custom codes, link expiry and privacy-friendly click analytics. Sign in with GitHub and start shortening in seconds.';

export const LANDING_NAV: NavLink[] = [
	{ href: '/#features', label: 'Features' },
	{ href: '/#how-it-works', label: 'How it works' },
	{ href: '/#analytics', label: 'Analytics' },
	{ href: '/docs', label: 'API docs' },
];

export function renderLanding(o: LandingOptions): string {
	const authed = !!o.user;
	const repo = o.repoUrl ?? REPO_URL;
	const errorMsg = o.authError ? (AUTH_ERRORS[o.authError] ?? 'Sign-in failed. Please try again.') : null;

	const submitLabel = authed
		? `Shorten ${icon('arrow', { size: 15 })}`
		: `${icon('github', { size: 15, filled: true })} Continue with GitHub`;

	const hint = authed
		? `${icon('check', { size: 14 })} Signed in as <strong>@${esc(o.user?.login)}</strong>. Links stay private to your account.`
		: `${icon('lock', { size: 14 })} Free with GitHub. No password, no email list, no third-party trackers.`;

	const content = `<main>
  <section class="container hero rule">
    <span class="badge"><span class="pulse"></span> Open source &middot; Runs on Cloudflare Workers</span>
    <h1>Short links,<br /><span class="dim">long reach.</span></h1>
    <p class="lead">SHRT turns sprawling URLs into crisp, shareable links served from the edge, with per-click analytics that respect the people clicking them.</p>

    ${errorMsg ? `<div class="alert">${esc(errorMsg)}</div>` : ''}

    <form class="shorten" id="shorten" novalidate>
      <div class="shorten-row">
        <label class="field">
          ${icon('link', { size: 16 })}
          <input id="url" name="url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://example.com/a/very/long/path" aria-label="URL to shorten" required />
        </label>
        <button class="btn btn-primary" type="submit">${submitLabel}</button>
      </div>
      <p class="shorten-hint">${hint}</p>
      <div class="alert" id="form-error" role="alert" hidden></div>
      <div class="result" id="result" role="status" aria-live="polite">
        <a id="result-link" href="#" target="_blank" rel="noreferrer noopener"></a>
        <button class="btn btn-outline btn-sm" type="button" id="copy-btn" data-copy="">${icon('copy', { size: 14 })} <span>Copy</span></button>
      </div>
    </form>
  </section>

  <section class="container rule">
    <div class="bleed cells cells-4">
      ${stat('300+', 'edge locations serving redirects')}
      ${stat('&lt;30ms', 'typical warm redirect latency')}
      ${stat('100%', 'self-hosted on your own account')}
      ${stat('0', 'third-party tracking scripts')}
    </div>
  </section>

  <section class="container section rule" id="features">
    <div class="section-head">
      <p class="eyebrow">Features</p>
      <h2>Everything a link needs. Nothing it does not.</h2>
      <p>No bloated dashboard, no cookie banner, no marketing pixels. Fast redirects and the numbers that tell you what is working.</p>
    </div>
    <div class="bleed cells cells-3">
      ${feature('bolt', 'Edge-fast redirects', 'Every short link resolves at the nearest Cloudflare location, with a read-through KV cache so the hot path never waits on the database.')}
      ${feature('chart', 'Click analytics', 'Clicks, countries, referrers and a 30-day trend, per link and across your whole account.')}
      ${feature('link', 'Custom short codes', 'Claim memorable slugs like <code>/launch</code> or <code>/me</code>. Reserved routes are always protected.')}
      ${feature('clock', 'Expiring links', 'Give a link a lifetime. Once it lapses it returns a clean <code>410 Gone</code> instead of a dead redirect.')}
      ${feature('key', 'Per-account API keys', 'Create and revoke scoped keys from the dashboard. There is no shared global secret to leak.')}
      ${feature('shield', 'Hardened by default', 'Hashed session tokens, <code>__Host-</code> cookies, CSRF synchronizer tokens, rate limiting and a strict CSP.')}
    </div>
  </section>

  <section class="container section rule" id="how-it-works">
    <div class="section-head">
      <p class="eyebrow">How it works</p>
      <h2>Three steps. About ten seconds.</h2>
    </div>
    <div class="bleed cells cells-3">
      ${step(1, 'Sign in with GitHub', 'One click, no password. SHRT reads your public profile and primary email, and nothing else.')}
      ${step(2, 'Paste your URL', 'Drop in any http or https link. Optionally claim a custom code or set an expiry.')}
      ${step(3, 'Share and measure', 'Send the short link anywhere and watch clicks, countries and referrers arrive live.')}
    </div>
  </section>

  <section class="container section rule" id="analytics">
    <div class="split">
      <div>
        <p class="eyebrow">Analytics</p>
        <h2 style="margin-top:0.75rem;font-size:clamp(1.625rem,4vw,2.25rem);letter-spacing:-0.035em">Know what works without spying on anyone.</h2>
        <p style="margin-top:0.875rem;color:var(--muted-foreground);line-height:1.65">SHRT records the essentials for understanding traffic and stops there. The data lives in your own Cloudflare account, in your own D1 database.</p>
        <ul class="checks">
          <li><span class="tick">${icon('check', { size: 11 })}</span> Per-link clicks with first and last seen</li>
          <li><span class="tick">${icon('check', { size: 11 })}</span> Country and referrer breakdowns</li>
          <li><span class="tick">${icon('check', { size: 11 })}</span> 30-day click trend, per link or account-wide</li>
          <li><span class="tick">${icon('check', { size: 11 })}</span> Session control, revoke any device instantly</li>
        </ul>
        <a class="btn btn-outline btn-sm" style="margin-top:1.5rem" href="/docs">${icon('book', { size: 15 })} Read the API reference</a>
      </div>
      ${codeCard(o.baseUrl)}
    </div>
  </section>

  <section class="container section cta rule" id="open-source">
    <div>
      <h2>${authed ? 'Your links are waiting.' : 'Ready to make every link count?'}</h2>
      <p>${authed ? 'Jump back into the dashboard, or read the API reference to automate the boring parts.' : 'Sign in with GitHub and create your first short link in seconds. Free, fast, and entirely yours.'}</p>
      <div class="row">
        <a class="btn btn-primary btn-lg" href="${authed ? '/dashboard' : '/auth/github'}">${icon('github', { size: 16, filled: true })} ${authed ? 'Open dashboard' : 'Get started with GitHub'}</a>
        <a class="btn btn-outline btn-lg" href="${esc(repo)}" target="_blank" rel="noreferrer noopener">${icon('code', { size: 16 })} Read the source ${icon('external', { size: 13 })}</a>
      </div>
      <p style="margin-top:1.5rem;font-size:0.8125rem">MIT licensed. Deploy your own copy in a few minutes.</p>
    </div>
  </section>
</main>`;

	return renderPage({
		origin: o.origin,
		user: o.user,
		csrf: o.csrf,
		title: TITLE,
		description: DESCRIPTION,
		canonical: `${o.origin}/`,
		nav: LANDING_NAV,
		content,
		bodyAttrs: `data-authed="${authed ? 'true' : 'false'}" data-csrf="${esc(o.csrf ?? '')}"`,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: 'SHRT',
			applicationCategory: 'UtilitiesApplication',
			operatingSystem: 'Web',
			description: DESCRIPTION,
			url: o.origin,
			license: 'https://opensource.org/licenses/MIT',
			codeRepository: repo,
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		},
	});
}

const stat = (value: string, label: string): string => `<div class="stat"><div class="v">${value}</div><div class="l">${label}</div></div>`;

const feature = (name: IconName, title: string, body: string): string =>
	`<div class="feature"><div class="icon">${icon(name, { size: 17 })}</div><h3>${title}</h3><p>${body}</p></div>`;

const step = (n: number, title: string, body: string): string =>
	`<div class="step"><div class="n">${n}</div><h3>${title}</h3><p>${body}</p></div>`;

function codeCard(baseUrl: string): string {
	const snippet =
		`curl -X POST ${baseUrl}/create \\\n` +
		`  -H "Authorization: Bearer $SHRT_API_KEY" \\\n` +
		`  -H "content-type: application/json" \\\n` +
		`  -d '{"url":"https://example.com"}'`;

	return `<div class="card code-card">
  <div class="code-head">
    ${icon('terminal', { size: 15 })}
    <span class="name">create-link.sh</span>
    <button class="btn btn-ghost btn-sm" type="button" data-copy="${esc(snippet)}">${icon('copy', { size: 14 })} <span>Copy</span></button>
  </div>
  <pre class="code"><span class="cm"># Create a link with an account API key</span>
<span class="fn">curl</span> -X POST <span class="st">${esc(baseUrl)}/create</span> \\
  -H <span class="st">"Authorization: Bearer $SHRT_API_KEY"</span> \\
  -H <span class="st">"content-type: application/json"</span> \\
  -d <span class="st">'{"url":"https://example.com"}'</span>

<span class="cm"># 201 Created</span>
{
  <span class="ky">"short_url"</span>: <span class="st">"${esc(baseUrl)}/aB3xK9q"</span>,
  <span class="ky">"id"</span>: <span class="st">"aB3xK9q"</span>,
  <span class="ky">"expires_at"</span>: <span class="ky">null</span>
}</pre>
</div>`;
}
