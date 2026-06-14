import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 15_000, refetchOnWindowFocus: false, retry: 1 },
	},
});

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<BrowserRouter basename="/admin">
				<AuthProvider>
					<App />
				</AuthProvider>
			</BrowserRouter>
		</QueryClientProvider>
	</StrictMode>
);
