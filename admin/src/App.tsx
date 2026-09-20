import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Skeleton, SkeletonRows, SkeletonStats, Skeletons } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';

// Lazy-loaded so the heavy chart pages (recharts) load on demand.
const Overview = lazy(() => import('./pages/Overview'));
const Links = lazy(() => import('./pages/Links'));
const LinkDetail = lazy(() => import('./pages/LinkDetail'));
const Sessions = lazy(() => import('./pages/Sessions'));
const ApiKeys = lazy(() => import('./pages/ApiKeys'));
const Users = lazy(() => import('./pages/Users'));

export default function App() {
	const { status, user } = useAuth();

	// The session check runs before the shell exists, so this stands in for the
	// whole page rather than for one panel inside it.
	if (status === 'loading') {
		return (
			<div className="min-h-dvh">
				<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
					<Skeletons label="Checking your session">
						<div className="mb-6">
							<Skeleton className="h-6 w-40" />
							<Skeleton className="mt-2 h-3 w-64" />
						</div>
						<SkeletonStats />
						<div className="mt-4 rounded-xl border border-border bg-surface">
							<SkeletonRows rows={5} />
						</div>
					</Skeletons>
				</div>
			</div>
		);
	}

	if (status === 'guest') return <Login />;

	return (
		<Routes>
			<Route element={<Layout />}>
				<Route index element={<Overview />} />
				<Route path="links" element={<Links />} />
				<Route path="links/:id" element={<LinkDetail />} />
				<Route path="sessions" element={<Sessions />} />
				<Route path="keys" element={<ApiKeys />} />
				{user?.role === 'admin' && <Route path="users" element={<Users />} />}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
}
