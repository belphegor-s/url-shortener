import { useAuth } from '../lib/auth';
import { Button } from '../components/ui';
import { IconGithub, IconLink, IconCheck } from '../components/icons';

const PERKS = ['Your own private link dashboard', 'Per-click analytics and 30-day trends', 'Custom codes, expiry and instant disable'];

export default function Login() {
	const { signIn } = useAuth();

	return (
		<div className="grid min-h-dvh place-items-center px-4 py-10">
			<div className="animate-in w-full max-w-[400px]">
				<div className="mb-7 flex flex-col items-center text-center">
					<div className="mark mb-4 size-11 rounded-xl">
						<IconLink className="size-5" />
					</div>
					<h1 className="text-lg font-semibold tracking-tight">Sign in to SHRT</h1>
					<p className="mt-1 text-sm text-muted">Short links and analytics, straight from the edge.</p>
				</div>

				<div className="dashed-box rounded-xl border-border-strong bg-surface p-5">
					<ul className="mb-5 space-y-2.5">
						{PERKS.map((p) => (
							<li key={p} className="flex items-start gap-2.5 text-[13px] text-muted">
								<span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-success/15 text-success">
									<IconCheck className="size-3" />
								</span>
								{p}
							</li>
						))}
					</ul>

					<Button variant="primary" className="w-full" onClick={signIn}>
						<IconGithub className="size-4" /> Continue with GitHub
					</Button>
					<p className="mt-3 text-center text-[12px] text-faint">No password to remember. We only read your public profile and primary email.</p>
				</div>

				<p className="mt-5 text-center text-[12px] text-faint">
					By continuing you agree to the{' '}
					<a href="/terms" className="underline decoration-border-strong underline-offset-2 transition hover:text-fg">
						Terms
					</a>{' '}
					and{' '}
					<a href="/privacy" className="underline decoration-border-strong underline-offset-2 transition hover:text-fg">
						Privacy policy
					</a>
					.
				</p>
				<p className="mt-2 text-center text-[12px] text-faint">
					<a href="/" className="transition hover:text-fg">
						Back to site
					</a>
				</p>
			</div>
		</div>
	);
}
