import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth';
import { initTheme } from './lib/theme';
import App from './App';
import './index.css';

// Before the first render, so the login screen and boot skeletons come up in the
// stored theme instead of flipping once the shell mounts.
initTheme();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 15_000, refetchOnWindowFocus: false, retry: 1 },
	},
});

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<BrowserRouter basename="/dashboard">
				<AuthProvider>
					<App />
				</AuthProvider>
			</BrowserRouter>
		</QueryClientProvider>
	</StrictMode>
);
