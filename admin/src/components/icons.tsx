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
