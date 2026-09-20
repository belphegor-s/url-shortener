import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { fail } from '../lib/responses';
import { requireUser, clientMeta } from '../lib/guards';
import { createSession, clearSessionCookie, revokeSession, sessionCookie } from '../lib/session';
import { createState, consumeState, exchangeCode, fetchGithubUser, fetchPrimaryEmail, githubAuthorizeUrl, safeReturnTo } from '../lib/oauth';
import { upsertUser } from '../lib/users';

export const auth = new Hono<AppEnv>();

/** Start the GitHub OAuth flow. Rate-limited to blunt scripted abuse of the authorize hop. */
auth.get('/auth/github', async (c) => {
	const limiter = c.env.LOGIN_LIMITER;
	if (limiter) {
		const key = c.req.header('cf-connecting-ip') || 'anonymous';
		if (!(await limiter.limit({ key })).success) return fail(c, 429, 'rate_limited', 'Too many attempts, try again later');
	}

	const returnTo = safeReturnTo(c.req.query('next'), '/dashboard');
	const state = await createState(c.env, returnTo);
	const redirectUri = `${new URL(c.req.url).origin}/auth/github/callback`;
	return c.redirect(githubAuthorizeUrl(c.env, state, redirectUri));
});

/** OAuth callback: validate state, exchange code, upsert user, establish session. */
auth.get('/auth/github/callback', async (c) => {
	// GitHub surfaces user-facing errors (e.g. access_denied) as query params.
	if (c.req.query('error')) return c.redirect('/?auth_error=denied');

	const code = c.req.query('code');
	const returnTo = await consumeState(c.env, c.req.query('state'));
	if (!code || returnTo === null) return c.redirect('/?auth_error=state');

	let profile;
	try {
		const redirectUri = `${new URL(c.req.url).origin}/auth/github/callback`;
		const token = await exchangeCode(c.env, code, redirectUri);
		profile = await fetchGithubUser(token);
		const email = profile.email ?? (await fetchPrimaryEmail(token));
		const user = await upsertUser(c.env, profile, email);

		const { token: sessionToken } = await createSession(c.env, user.id, clientMeta(c));
		c.header('Set-Cookie', sessionCookie(sessionToken));
		return c.redirect(returnTo);
	} catch (err) {
		console.error('github oauth callback failed', String(err));
		return c.redirect('/?auth_error=exchange');
	}
});

/** Sign out (session + CSRF enforced). */
auth.post('/auth/logout', requireUser(), async (c) => {
	await revokeSession(c.env, c.get('sessionId'));
	c.header('Set-Cookie', clearSessionCookie());
	return c.json({ success: true });
});
