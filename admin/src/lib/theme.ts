import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'light' | 'dark';

/** Shared with the server-rendered site, so a choice made there carries over here. */
const KEY = 'shrt-theme';

function stored(): Theme | null {
	try {
		const value = localStorage.getItem(KEY);
		return value === 'light' || value === 'dark' ? value : null;
	} catch {
		return null;
	}
}

function systemTheme(): Theme {
	return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function paint(theme: Theme) {
	document.documentElement.setAttribute('data-theme', theme);
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#09090b' : '#ffffff');
}

/**
 * Pins the stored theme onto <html> before React renders, so the login screen and
 * the boot skeletons come up in the right theme rather than switching once the
 * shell mounts. CSS already resolves the unset case from the OS on its own, so
 * this only matters for a visitor whose stored choice differs from their system.
 */
export function initTheme(): Theme {
	const theme = stored() ?? systemTheme();
	paint(theme);
	return theme;
}

function current(): Theme {
	return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } };

/**
 * Runs `update` inside a view transition that ripples the new theme out from `origin`
 * (see `.theme-ripple` in index.css). Falls back to a plain swap without support,
 * without an origin, or when the user prefers reduced motion.
 */
function ripple(origin: Element | undefined, update: () => void) {
	const doc = document as ViewTransitionDocument;
	if (!doc.startViewTransition || !origin || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return update();

	const r = origin.getBoundingClientRect();
	const x = r.left + r.width / 2;
	const y = r.top + r.height / 2;
	// The rings trail the edge by ~150px, so run the wave past the far corner.
	const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 150;
	const root = document.documentElement;
	root.style.setProperty('--ripple-x', `${x}px`);
	root.style.setProperty('--ripple-y', `${y}px`);
	root.style.setProperty('--ripple-end', `${end}px`);
	root.classList.add('theme-ripple');
	doc.startViewTransition(update).finished.finally(() => root.classList.remove('theme-ripple'));
}

export function useTheme(): [Theme, (origin?: Element) => void] {
	const [theme, setTheme] = useState<Theme>(current);

	useEffect(() => {
		paint(theme);
	}, [theme]);

	const toggle = useCallback((origin?: Element) => {
		const next: Theme = current() === 'dark' ? 'light' : 'dark';
		try {
			localStorage.setItem(KEY, next);
		} catch {
			/* private mode: the choice just does not persist */
		}
		// The new snapshot is taken when `update` returns, so the DOM must be final by then.
		ripple(origin, () => {
			paint(next);
			flushSync(() => setTheme(next));
		});
	}, []);

	return [theme, toggle];
}
