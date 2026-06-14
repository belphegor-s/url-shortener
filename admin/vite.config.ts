import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dashboard is served by the Worker under /admin, so all assets are prefixed.
// Output goes to ../dist-admin, which the Worker exposes via the ASSETS binding.
export default defineConfig({
	base: '/admin/',
	plugins: [react(), tailwindcss()],
	build: {
		outDir: '../dist-admin',
		emptyOutDir: true,
		rollupOptions: {
			output: {
				// Only peel off the heavy *leaf* libraries (recharts is lazy-loaded with the chart
				// pages, motion is large). React and friends stay together in the entry chunk —
				// splitting React across chunks caused a vendor<->react circular import.
				manualChunks(id) {
					if (!id.includes('node_modules')) return;
					// Leaf libraries with no React dependency — safe to isolate, big + cacheable.
					if (id.includes('d3-') || id.includes('victory-vendor') || id.includes('internmap')) return 'd3';
					if (id.includes('lodash')) return 'lodash';
					if (id.includes('recharts') || id.includes('react-smooth') || id.includes('react-transition-group')) return 'charts';
					if (id.includes('/motion/') || id.includes('framer-motion')) return 'motion';
				},
			},
		},
	},
	server: {
		port: 5173,
		// Proxy API + public endpoints to the local Worker during `npm run dev`.
		proxy: {
			'/api': 'http://localhost:8787',
			'/create': 'http://localhost:8787',
			'/analytics': 'http://localhost:8787',
		},
	},
});
