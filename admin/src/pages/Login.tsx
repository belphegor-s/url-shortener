import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { Button, Input } from '../components/ui';
import { IconLink } from '../components/icons';

export default function Login() {
	const { login } = useAuth();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await login(username, password);
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Something went wrong');
			setLoading(false);
		}
	}

	return (
		<div className="relative grid min-h-dvh place-items-center px-4">
			<div className="accent-glow pointer-events-none absolute inset-x-0 top-0 h-72" />
			<div className="animate-in relative w-full max-w-[380px]">
				<div className="mb-7 flex flex-col items-center text-center">
					<div className="mb-4 grid size-12 place-items-center rounded-2xl border border-border bg-surface shadow-lg">
						<IconLink className="size-5 text-accent" />
					</div>
					<h1 className="text-lg font-semibold tracking-tight">Welcome back</h1>
					<p className="mt-1 text-sm text-muted">Sign in to the admin dashboard</p>
				</div>

				<form onSubmit={onSubmit} className="rounded-2xl border border-border bg-surface p-5 shadow-2xl">
					<label className="mb-1.5 block text-[13px] font-medium text-muted">Username</label>
					<Input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" placeholder="ayush" className="mb-4" />

					<label className="mb-1.5 block text-[13px] font-medium text-muted">Password</label>
					<Input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						placeholder="••••••••"
						className="mb-4"
					/>

					{error && <p className="mb-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>}

					<Button type="submit" variant="primary" loading={loading} className="w-full">
						Sign in
					</Button>
				</form>
				<p className="mt-5 text-center text-[12px] text-faint">Protected · session secured with CSRF</p>
			</div>
		</div>
	);
}
