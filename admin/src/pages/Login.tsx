import { useAuth } from '../lib/auth';
import { Button } from '../components/ui';
import { IconGithub, IconLink, IconCheck } from '../components/icons';

const PERKS = ['Your own private link dashboard', 'Per-click analytics and 30-day trends', 'Custom codes, expiry and instant disable'];

export default function Login() {
	const { signIn } = useAuth();

	return (
		<div className="relative grid min-h-dvh place-items-center px-4">
			<div className="accent-glow pointer-events-none absolute inset-x-0 top-0 h-72" />
			<div className="animate-in relative w-full max-w-[400px]">
				<div className="mb-7 flex flex-col items-center text-center">
					<div className="mb-4 grid size-12 place-items-center rounded-2xl border border-border bg-surface shadow-lg">
						<IconLink className="size-5 text-accent" />
					</div>
					<h1 className="text-lg font-semibold tracking-tight">Sign in to SHRT</h1>
					<p className="mt-1 text-sm text-muted">Short links and analytics, straight from the edge.</p>
				</div>

				<div className="rounded-2xl border border-border bg-surface p-5 shadow-2xl">
					<ul className="mb-5 space-y-2.5">
						{PERKS.map((p) => (
							<li key={p} className="flex items-start gap-2.5 text-[13px] text-muted">
								<span className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
									<IconCheck className="size-3" />
								</span>
								{p}
							</li>
						))}
					</ul>

					<Button variant="primary" className="w-full" onClick={signIn}>
						<IconGithub className="size-4" /> Continue with GitHub
					</Button>
					<p className="mt-3 text-center text-[12px] text-faint">No password to remember — we only read your public profile and primary email.</p>
				</div>
				<p className="mt-5 text-center text-[12px] text-faint">
					<a href="/" className="hover:text-muted">
						← Back to home
					</a>
				</p>
			</div>
		</div>
	);
}
