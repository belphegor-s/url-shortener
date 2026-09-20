import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setCsrf, ApiError, type User } from './api';

interface AuthState {
	status: 'loading' | 'authed' | 'guest';
	user: User | null;
	/** Kick off the GitHub OAuth flow, returning to the dashboard afterwards. */
	signIn: () => void;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<AuthState['status']>('loading');
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		api
			.me()
			.then((me) => {
				setCsrf(me.csrf);
				setUser(me.user);
				setStatus('authed');
			})
			.catch((err) => {
				if (err instanceof ApiError && err.status === 401) setStatus('guest');
				else setStatus('guest');
			});
	}, []);

	const signIn = () => {
		window.location.href = '/auth/github?next=' + encodeURIComponent('/dashboard');
	};

	const logout = async () => {
		await api.logout().catch(() => {});
		setCsrf(null);
		setUser(null);
		setStatus('guest');
	};

	return <AuthContext.Provider value={{ status, user, signIn, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
