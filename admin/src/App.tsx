import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Spinner } from './components/ui';
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

	if (status === 'loading') {
		return (
			<div className="grid min-h-dvh place-items-center text-muted">
				<Spinner className="size-6" />
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
