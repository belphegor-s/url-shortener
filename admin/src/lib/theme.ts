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

let audio: AudioContext | undefined;

/**
 * A soft water-drop "bloop" to go with the ripple, synthesized so there is no asset
 * to load: a sine whose pitch glides up, then a fainter echo. Lower going to dark,
 * brighter going to light. Created lazily inside the click, so autoplay rules allow it.
 */
function droplet(to: Theme) {
	try {
		const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!Ctx) return;
		audio ??= new Ctx();
		const ctx = audio;
		if (ctx.state === 'suspended') void ctx.resume();
		const t = ctx.currentTime;
		const blip = (from: number, to: number, start: number, dur: number, vol: number) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(from, start);
			osc.frequency.exponentialRampToValueAtTime(to, start + dur * 0.35);
			gain.gain.setValueAtTime(0, start);
			gain.gain.linearRampToValueAtTime(vol, start + 0.006);
			gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
			osc.connect(gain).connect(ctx.destination);
			osc.start(start);
			osc.stop(start + dur + 0.02);
		};
		const base = to === 'dark' ? 520 : 780;
		blip(base, base * 2.1, t, 0.14, 0.08);
		blip(base * 1.5, base * 2.4, t + 0.08, 0.2, 0.03);
	} catch {
		/* audio is decoration; never let it break the toggle */
	}
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
		droplet(next);
		// The new snapshot is taken when `update` returns, so the DOM must be final by then.
		ripple(origin, () => {
			paint(next);
			flushSync(() => setTheme(next));
		});
	}, []);

	return [theme, toggle];
}
