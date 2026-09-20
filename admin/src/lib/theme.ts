import { useCallback, useEffect, useState } from 'react';

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

export function useTheme(): [Theme, () => void] {
	const [theme, setTheme] = useState<Theme>(current);

	useEffect(() => {
		paint(theme);
	}, [theme]);

	const toggle = useCallback(() => {
		setTheme((prev) => {
			const next: Theme = prev === 'dark' ? 'light' : 'dark';
			try {
				localStorage.setItem(KEY, next);
			} catch {
				/* private mode: the choice just does not persist */
			}
			return next;
		});
	}, []);

	return [theme, toggle];
}
