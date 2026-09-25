import type { User } from '../types';
import { esc, renderPage, REPO_URL, type NavLink } from './chrome';
import { docsStyles } from './docs-styles';
import { icon, type IconName } from './icons';
import { legalStyles } from './legal-styles';

export type LegalKind = 'privacy' | 'terms';

export interface LegalOptions {
	origin: string;
	user: User | null;
	csrf?: string;
}

/** Bump whenever the substance of either document changes. */
const LAST_UPDATED = '2026-09-25';

/** Where questions and data requests go. Public issues keep the process transparent. */
const CONTACT_URL = `${REPO_URL}/issues/new`;

const NAV: NavLink[] = [
	{ href: '/#features', label: 'Features' },
	{ href: '/#how-it-works', label: 'How it works' },
	{ href: '/#analytics', label: 'Analytics' },
	{ href: '/docs', label: 'API docs' },
];

interface Ctx {
	host: string;
}

interface Section {
	id: string;
	label: string;
	body: (ctx: Ctx) => string;
}

interface Glance {
	icon: IconName;
	title: string;
	text: string;
}

interface LegalDoc {
	path: string;
	title: string;
	heading: string;
	description: string;
	lead: (ctx: Ctx) => string;
	glance: Glance[];
	sections: Section[];
}

// ------------------------------------------------------------------ helpers ---

const list = (items: string[]): string =>
	`<ul class="reset legal-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

const note = (glyph: IconName, html: string): string =>
	`<div class="legal-note"><span class="legal-note-icon">${icon(glyph, { size: 15 })}</span><p>${html}</p></div>`;

const table = (head: string[], rows: string[][]): string => `<div class="table-wrap legal-table">
        <table>
          <thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>`;

const link = (href: string, label: string): string =>
	href.startsWith('http')
		? `<a href="${esc(href)}" target="_blank" rel="noreferrer noopener">${label}</a>`
		: `<a href="${esc(href)}">${label}</a>`;

// ------------------------------------------------------------------ privacy ---

const PRIVACY: LegalDoc = {
	path: '/privacy',
	title: 'Privacy policy - SHRT',
	heading: 'Privacy policy',
	description:
		'What SHRT collects when you sign in, create short links or click one, why it is collected, how long it is kept and how to have it removed.',
	lead: ({ host }) =>
		`This policy explains what the SHRT service at <strong>${esc(host)}</strong> collects, why, and what you can do about it. It is written to be read, not skimmed past.`,
	glance: [
		{ icon: 'shield', title: 'No ads, no selling', text: 'Data is used to run the service and show you your own analytics. Nothing else.' },
		{ icon: 'lock', title: 'One cookie', text: 'A single session cookie, set only after you sign in. No tracking cookies.' },
		{ icon: 'trash', title: 'Delete anytime', text: 'Deleting a link removes it and every click recorded against it, immediately.' },
	],
	sections: [
		{
			id: 'who-we-are',
			label: 'Who we are',
			body: ({ host }) => `<p>SHRT is an open-source URL shortener. This policy covers the hosted instance at <strong>${esc(host)}</strong>. If you run your own copy of the ${link(REPO_URL, 'source code')}, you are the operator of that instance and responsible for its privacy practices.</p>`,
		},
		{
			id: 'what-we-collect',
			label: 'What we collect',
			body: () => `<p>We collect the minimum needed to shorten links, redirect them and report clicks back to the person who created them.</p>
      ${table(
				['Data', 'What it includes', 'When'],
				[
					['Account', 'GitHub user id, username, display name, primary email and avatar URL.', 'When you sign in with GitHub.'],
					['Links', 'The destination URL, short code, optional expiry and creation time.', 'When you create a link.'],
					['Clicks', 'IP address, user agent, referring page, country and time of the click.', 'When anyone opens a short link.'],
					['Sessions', 'A hashed session token, IP address, user agent, country and activity times.', 'While you are signed in.'],
					['API keys', 'A hash of the key, a short display prefix, its name and when it was last used.', 'When you create a key.'],
				]
			)}
      ${note('eye', 'We never see or store your GitHub password. Sign-in asks GitHub only for your public profile and email address, and we never request access to your repositories.')}`,
		},
		{
			id: 'how-we-use-it',
			label: 'How we use it',
			body: () => `<p>We use the data above to:</p>
      ${list([
				'Create, resolve and redirect your short links.',
				'Show you click counts, referrers, countries and devices for links you own.',
				'Keep you signed in, and let you review and revoke your sessions and API keys.',
				'Prevent abuse, enforce rate limits and keep the service secure.',
			])}
      <p>We do not sell personal data, show advertising, build profiles for marketing or share data with data brokers.</p>`,
		},
		{
			id: 'cookies',
			label: 'Cookies and storage',
			body: () => `<p>Visiting the site does not set any cookie. Signing in sets one strictly necessary cookie, <code>HttpOnly</code>, <code>Secure</code> and <code>SameSite=Lax</code>, that keeps you signed in for up to 30 days.</p>
      <p>Your light or dark theme choice is remembered in your browser&rsquo;s local storage and never leaves your device. We may use Cloudflare Web Analytics to count page views in aggregate; it does not use cookies or fingerprint visitors.</p>`,
		},
		{
			id: 'who-sees-it',
			label: 'Who can see it',
			body: () => `${list([
				'<strong>You</strong>, for your own account, links, sessions, keys and the click data on links you created.',
				'<strong>Instance administrators</strong>, who can view all accounts and links in order to operate and moderate the service.',
				'<strong>Cloudflare</strong>, which hosts the service and processes requests on our behalf.',
				'<strong>GitHub</strong>, which handles sign-in under its own privacy statement.',
			])}
      <p>We may disclose information if required by law, or where necessary to investigate abuse such as phishing or malware distribution.</p>`,
		},
		{
			id: 'link-visitors',
			label: 'If you clicked a link',
			body: () => `<p>When you open a short link, we record the click as described above so its creator can see how the link performs. The creator can see the raw details of each click, including IP address and user agent. We do not link clicks to an identity or follow you across other sites.</p>
      <p>To have clicks on a specific link removed, contact the person who shared it, or ${link(CONTACT_URL, 'get in touch with us')}.</p>`,
		},
		{
			id: 'retention',
			label: 'How long we keep it',
			body: () => `${table(
				['Data', 'Kept until'],
				[
					['Account', 'You ask us to delete your account.'],
					['Links and clicks', 'You delete the link. Its clicks are deleted with it.'],
					['Sessions', 'You sign out or revoke the session, or 30 days pass.'],
					['API keys', 'You revoke the key.'],
					['Sign-in state', 'Ten minutes, or once sign-in completes.'],
				]
			)}
      <p>Deleted links are also evicted from the edge cache, so they stop resolving right away. Encrypted infrastructure backups may take a short time to roll over.</p>`,
		},
		{
			id: 'your-choices',
			label: 'Your choices',
			body: () => `<p>From the ${link('/dashboard', 'dashboard')} you can, at any time:</p>
      ${list([
				'Delete any of your links along with their click history.',
				'Revoke any signed-in session, including ones on other devices.',
				'Revoke API keys you no longer use.',
			])}
      <p>To export or delete your account and everything attached to it, ${link(CONTACT_URL, 'open a request')}. You can also revoke SHRT&rsquo;s access from your GitHub settings under <em>Applications</em>. Depending on where you live, you may have additional rights to access, correct or object to processing of your data, and we will honour those requests.</p>`,
		},
		{
			id: 'security',
			label: 'Security',
			body: () => `<p>All traffic is served over HTTPS. Session tokens and API keys are stored only as SHA-256 hashes, so a database leak would not yield working credentials. Pages ship with a strict Content Security Policy, and the whole codebase is public for anyone to audit.</p>`,
		},
		{
			id: 'children',
			label: 'Children',
			body: () => `<p>SHRT is not directed at children under 13, and we do not knowingly collect their personal data. GitHub accounts, which are required to sign in, are themselves limited to users 13 and over.</p>`,
		},
		{
			id: 'changes',
			label: 'Changes',
			body: () => `<p>If this policy changes, we will update the date at the top of this page. For significant changes we will make reasonable efforts to let signed-in users know. The full history of this page is visible in the ${link(REPO_URL, 'repository')}.</p>`,
		},
	],
};

// -------------------------------------------------------------------- terms ---

const TERMS: LegalDoc = {
	path: '/terms',
	title: 'Terms of service - SHRT',
	heading: 'Terms of service',
	description: 'The terms for using the hosted SHRT URL shortener and its API: acceptable use, your content, availability and liability.',
	lead: ({ host }) =>
		`These terms govern your use of the SHRT service at <strong>${esc(host)}</strong>, including the website, the dashboard and the HTTP API. By using the service you agree to them.`,
	glance: [
		{ icon: 'check', title: 'Free and open', text: 'The service is free to use and the code is MIT licensed.' },
		{ icon: 'shield', title: 'Link responsibly', text: 'No phishing, malware, spam or anything illegal. Abusive links are removed.' },
		{ icon: 'clock', title: 'Provided as is', text: 'We work hard to stay up, but there is no uptime guarantee.' },
	],
	sections: [
		{
			id: 'the-service',
			label: 'The service',
			body: () => `<p>SHRT turns long URLs into short links, redirects visitors to the original destination and reports click analytics to the link&rsquo;s creator. The service is provided free of charge. We may add, change or remove features at any time.</p>`,
		},
		{
			id: 'accounts',
			label: 'Your account',
			body: () => `<p>You sign in with a GitHub account and must follow GitHub&rsquo;s own terms to use it. You are responsible for all activity under your account and for keeping your API keys secret. If you believe a key or session has been compromised, revoke it from the dashboard straight away.</p>`,
		},
		{
			id: 'acceptable-use',
			label: 'Acceptable use',
			body: () => `<p>Short links are trusted by the people who click them. You agree not to use SHRT to create or share links that:</p>
      ${list([
				'Lead to phishing pages, malware, or any content designed to deceive or harm visitors.',
				'Promote spam, or are sent in unsolicited bulk messages.',
				'Host or point to content that is illegal, or that exploits or endangers minors.',
				'Infringe the intellectual property or privacy of others.',
				'Harass, threaten or incite violence against any person or group.',
				'Hide the destination of a link in order to evade another platform&rsquo;s filters or rules.',
			])}
      <p>You also agree not to probe, overload or disrupt the service, work around rate limits, or access other people&rsquo;s accounts or data.</p>`,
		},
		{
			id: 'your-content',
			label: 'Your content',
			body: () => `<p>You keep every right you have in the URLs you shorten. You grant us only the permission needed to store them, redirect visitors to them and show you their analytics. You are responsible for the destinations you link to and for having the right to share them.</p>`,
		},
		{
			id: 'visitor-data',
			label: 'Visitor data',
			body: () => `<p>Links you share collect click data from the people who open them, as set out in the ${link('/privacy', 'privacy policy')}. If you use that data, you are responsible for doing so lawfully, for example by telling your own audience that you measure link clicks where the law requires it.</p>`,
		},
		{
			id: 'api',
			label: 'API use',
			body: () => `<p>The ${link('/docs', 'HTTP API')} is available to signed-in users through personal API keys. It is subject to the documented rate limits, and we may throttle or revoke keys that put the service or other users at risk.</p>`,
		},
		{
			id: 'enforcement',
			label: 'Enforcement',
			body: () => `<p>We may deactivate or delete links, and suspend or close accounts, that break these terms or that we reasonably believe put visitors at risk. Deactivated links return <code>410 Gone</code>. Where it is practical and safe to do so, we will tell you why.</p>
      ${note('shield', `Found a short link being used for phishing or abuse? ${link(CONTACT_URL, 'Report it')} with the short URL and we will look into it promptly.`)}`,
		},
		{
			id: 'availability',
			label: 'Availability',
			body: () => `<p>We aim to keep SHRT fast and reliable, but we do not guarantee that it will be available without interruption or that links will resolve forever. Links you set to expire stop working at their expiry time. We may discontinue the hosted service, and will give reasonable notice where we can.</p>`,
		},
		{
			id: 'disclaimer',
			label: 'Disclaimer',
			body: () => `<p>The service is provided <strong>&ldquo;as is&rdquo;</strong> and <strong>&ldquo;as available&rdquo;</strong>, without warranties of any kind, express or implied, including fitness for a particular purpose and non-infringement. We do not control, and are not responsible for, the websites that short links point to.</p>`,
		},
		{
			id: 'liability',
			label: 'Limitation of liability',
			body: () => `<p>To the fullest extent permitted by law, we are not liable for any indirect, incidental, special or consequential damages, or for any loss of data, revenue or goodwill, arising from your use of the service. Nothing in these terms limits liability that cannot be limited by law.</p>`,
		},
		{
			id: 'open-source',
			label: 'Open source',
			body: () => `<p>The SHRT source code is released under the ${link(`${REPO_URL}/blob/main/LICENSE.md`, 'MIT license')}. These terms apply to the hosted service only. If you self-host SHRT, the MIT license governs the code and you set the terms for your own instance.</p>`,
		},
		{
			id: 'changes',
			label: 'Changes',
			body: () => `<p>We may update these terms from time to time. The date at the top of this page shows when they last changed. If you keep using the service after an update, you accept the revised terms.</p>`,
		},
	],
};

const DOCS: Record<LegalKind, LegalDoc> = { privacy: PRIVACY, terms: TERMS };

// ------------------------------------------------------------------- render ---

const num = (i: number): string => String(i + 1).padStart(2, '0');

const formatDate = (iso: string): string =>
	new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Rough reading time at ~220 words per minute. */
const readingMinutes = (html: string): number =>
	Math.max(1, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 220));

export function renderLegal(kind: LegalKind, o: LegalOptions): string {
	const doc = DOCS[kind];
	const other = DOCS[kind === 'privacy' ? 'terms' : 'privacy'];
	const ctx: Ctx = { host: new URL(o.origin).host };

	const sections = doc.sections
		.map(
			(s, i) => `<section id="${s.id}" class="legal-section">
      <h2><span class="legal-num">${num(i)}</span>${esc(s.label)}</h2>
      ${s.body(ctx)}
    </section>`
		)
		.join('\n    ');

	const minutes = readingMinutes(doc.lead(ctx) + sections);

	const content = `<main class="container docs legal rule">
  <aside class="docs-nav" id="docs-nav">
    <h4>On this page</h4>
    <ul>
      <li><a href="#summary" data-docs-link="summary">Summary</a></li>
      ${doc.sections.map((s, i) => `<li><a href="#${s.id}" data-docs-link="${s.id}"><span class="legal-num">${num(i)}</span>${esc(s.label)}</a></li>`).join('\n      ')}
    </ul>
  </aside>

  <div class="docs-main legal-main">
    <section id="summary" class="legal-hero">
      <nav class="legal-tabs" aria-label="Legal documents">
        ${(['privacy', 'terms'] as const)
					.map((k) => `<a href="${DOCS[k].path}"${k === kind ? ' aria-current="page"' : ''}>${k === 'privacy' ? 'Privacy' : 'Terms'}</a>`)
					.join('')}
      </nav>
      <h1>${esc(doc.heading)}</h1>
      <p class="lead">${doc.lead(ctx)}</p>
      <p class="legal-meta">
        <span>Last updated <time datetime="${LAST_UPDATED}">${formatDate(LAST_UPDATED)}</time></span>
        <span class="legal-dot" aria-hidden="true"></span>
        <span>${minutes} min read</span>
      </p>

      <div class="legal-glance">
        ${doc.glance
					.map(
						(g) => `<div>
          <div class="icon">${icon(g.icon, { size: 16 })}</div>
          <h3>${esc(g.title)}</h3>
          <p>${esc(g.text)}</p>
        </div>`
					)
					.join('\n        ')}
      </div>
    </section>

    ${sections}

    <section class="legal-end" aria-label="Contact">
      <div>
        <h2>Questions?</h2>
        <p>Anything unclear, or a request about your data? Open an issue and we will get back to you.</p>
      </div>
      <div class="legal-end-actions">
        <a class="btn btn-primary btn-sm" href="${esc(CONTACT_URL)}" target="_blank" rel="noreferrer noopener">${icon('github', { size: 15, filled: true })} Get in touch</a>
        <a class="btn btn-outline btn-sm" href="${other.path}">${esc(other.heading)} ${icon('arrow', { size: 14 })}</a>
      </div>
    </section>
  </div>
</main>`;

	return renderPage({
		origin: o.origin,
		user: o.user,
		csrf: o.csrf,
		title: doc.title,
		description: doc.description,
		canonical: `${o.origin}${doc.path}`,
		nav: NAV,
		content,
		extraCss: docsStyles + legalStyles,
		bodyAttrs: `data-authed="${o.user ? 'true' : 'false'}"`,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'WebPage',
			name: doc.heading,
			description: doc.description,
			url: `${o.origin}${doc.path}`,
			dateModified: LAST_UPDATED,
		},
	});
}
