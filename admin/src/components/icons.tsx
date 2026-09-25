import type { SVGProps } from 'react';

// Minimal stroke icon set (no icon dependency). 24x24 viewBox, currentColor.
type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({
	width: 20,
	height: 20,
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 1.7,
	strokeLinecap: 'round' as const,
	strokeLinejoin: 'round' as const,
	...props,
});

export const IconChart = (p: P) => (
	<svg {...base(p)}>
		<path d="M3 3v18h18" />
		<path d="M7 14l3-3 3 3 4-5" />
	</svg>
);
export const IconLink = (p: P) => (
	<svg {...base(p)}>
		<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
		<path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
	</svg>
);
export const IconUsers = (p: P) => (
	<svg {...base(p)}>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
	</svg>
);
export const IconDiff = (p: P) => (
	<svg {...base(p)}>
		<path d="M12 3v14" />
		<path d="M5 10h14" />
		<path d="M5 21h14" />
	</svg>
);
export const IconSearch = (p: P) => (
	<svg {...base(p)}>
		<circle cx="11" cy="11" r="7" />
		<path d="m21 21-4.3-4.3" />
	</svg>
);
export const IconPlus = (p: P) => (
	<svg {...base(p)}>
		<path d="M12 5v14M5 12h14" />
	</svg>
);
export const IconTrash = (p: P) => (
	<svg {...base(p)}>
		<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
	</svg>
);
export const IconCopy = (p: P) => (
	<svg {...base(p)}>
		<rect x="9" y="9" width="12" height="12" rx="2" />
		<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
	</svg>
);
export const IconCheck = (p: P) => (
	<svg {...base(p)}>
		<path d="M20 6 9 17l-5-5" />
	</svg>
);
export const IconExternal = (p: P) => (
	<svg {...base(p)}>
		<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
	</svg>
);
export const IconLogout = (p: P) => (
	<svg {...base(p)}>
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
	</svg>
);
export const IconChevron = (p: P) => (
	<svg {...base(p)}>
		<path d="m9 18 6-6-6-6" />
	</svg>
);
export const IconX = (p: P) => (
	<svg {...base(p)}>
		<path d="M18 6 6 18M6 6l12 12" />
	</svg>
);
export const IconPower = (p: P) => (
	<svg {...base(p)}>
		<path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.8 0" />
	</svg>
);
export const IconMenu = (p: P) => (
	<svg {...base(p)}>
		<path d="M3 12h18M3 6h18M3 18h18" />
	</svg>
);
export const IconGlobe = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="9" />
		<path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
	</svg>
);
export const IconArrowUp = (p: P) => (
	<svg {...base(p)}>
		<path d="M7 17 17 7M7 7h10v10" />
	</svg>
);
export const IconKey = (p: P) => (
	<svg {...base(p)}>
		<circle cx="7.5" cy="15.5" r="4.5" />
		<path d="m10.7 12.3 8.3-8.3M17 6l2 2M14 9l2 2" />
	</svg>
);
export const IconGithub = ({ width = 20, height = 20, ...p }: P) => (
	<svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
		<path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
	</svg>
);
export const IconSun = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
	</svg>
);
export const IconMoon = (p: P) => (
	<svg {...base(p)}>
		<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
	</svg>
);
export const IconHome = (p: P) => (
	<svg {...base(p)}>
		<path d="M3 10.5 12 3l9 7.5" />
		<path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
	</svg>
);
