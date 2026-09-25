import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Button, Skeleton, SkeletonRows, SkeletonStats, Skeletons, SlidingIndicator, cx } from './ui';
import { IconChart, IconLink, IconUsers, IconKey, IconLogout, IconMenu, IconX, IconSun, IconMoon, IconHome, IconDevices } from './icons';

const NAV = [
	{ to: '/', label: 'Overview', icon: IconChart, end: true },
	{ to: '/links', label: 'Links', icon: IconLink, end: false },
	{ to: '/keys', label: 'API keys', icon: IconKey, end: false },
	{ to: '/sessions', label: 'Sessions', icon: IconDevices, end: false },
];

const ADMIN_NAV = [{ to: '/users', label: 'Users', icon: IconUsers, end: false }];

const ROW = 'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors';

function NavItems({ onNavigate, indicatorId, admin }: { onNavigate?: () => void; indicatorId: string; admin: boolean }) {
	const items = admin ? [...NAV, ...ADMIN_NAV] : NAV;
	return (
		// Scoped so the desktop sidebar and the mobile drawer never share an indicator
		// even while both are mounted.
		<LayoutGroup id={indicatorId}>
			<nav className="flex flex-col gap-1">
				{items.map(({ to, label, icon: Icon, end }) => (
					<NavLink
						key={to}
						to={to}
						end={end}
						onClick={onNavigate}
						className={({ isActive }) => cx('relative', ROW, isActive ? 'text-fg' : 'text-muted hover:bg-surface-2/60 hover:text-fg')}
					>
						{({ isActive }) => (
							<>
								{isActive && <SlidingIndicator layoutId="nav" />}
								<Icon className="relative z-10 size-[18px]" />
								<span className="relative z-10">{label}</span>
							</>
						)}
					</NavLink>
				))}
			</nav>
		</LayoutGroup>
	);
}

function Brand() {
	return (
		<div className="flex items-center gap-2.5 px-4">
			<div className="mark size-7 rounded-lg">
				<IconLink className="size-4" />
			</div>
			<div className="leading-tight">
				<div className="text-sm font-semibold text-fg">SHRT</div>
				<div className="text-[11px] text-faint">dashboard</div>
			</div>
		</div>
	);
}

function BackToSite() {
	return (
		<a href="/" className={cx(ROW, 'text-muted hover:bg-surface-2/60 hover:text-fg')}>
			<IconHome className="size-[18px]" />
			Back to site
		</a>
	);
}

function ThemeToggle() {
	const [theme, toggle] = useTheme();
	return (
		<button
			onClick={(e) => toggle(e.currentTarget)}
			title="Toggle theme"
			aria-label="Toggle theme"
			className="grid size-8 shrink-0 place-items-center rounded-lg text-faint transition hover:bg-surface-2 hover:text-fg"
		>
			{theme === 'dark' ? <IconSun className="size-[18px]" /> : <IconMoon className="size-[18px]" />}
		</button>
	);
}

export default function Layout() {
	const { user, logout } = useAuth();
	const [open, setOpen] = useState(false);
	const loc = useLocation();
	const admin = user?.role === 'admin';
	const nav = admin ? [...NAV, ...ADMIN_NAV] : NAV;
	const title = nav.find((n) => (n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to) && n.to !== '/'))?.label ?? 'Overview';

	const identity = (
		<div className="flex min-w-0 items-center gap-2.5">
			{user?.avatarUrl ? (
				<img src={user.avatarUrl} alt="" width={28} height={28} className="size-7 shrink-0 rounded-full border border-border" referrerPolicy="no-referrer" />
			) : (
				<div className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
					{user?.login?.[0]?.toUpperCase() ?? '?'}
				</div>
			)}
			<div className="min-w-0 leading-tight">
				<div className="truncate text-sm text-fg">{user?.name || user?.login}</div>
				<div className="truncate text-[11px] text-faint">@{user?.login}</div>
			</div>
		</div>
	);

	/** Nav list, a dashed break, then the way back out to the marketing site. */
	const navBlock = (indicatorId: string, onNavigate?: () => void) => (
		<div className="px-3">
			<NavItems indicatorId={indicatorId} admin={admin} onNavigate={onNavigate} />
			<div className="my-3 border-t border-dashed border-border" />
			<BackToSite />
		</div>
	);

	const accountBlock = (
		<div className="border-t border-dashed border-border px-4 pt-3.5">
			<div className="flex items-center justify-between gap-2">
				{identity}
				<div className="flex shrink-0 items-center">
					<ThemeToggle />
					<button
						onClick={logout}
						title="Sign out"
						aria-label="Sign out"
						className="grid size-8 shrink-0 place-items-center rounded-lg text-faint transition hover:bg-surface-2 hover:text-danger"
					>
						<IconLogout className="size-[18px]" />
					</button>
				</div>
			</div>
		</div>
	);

	return (
		<div className="min-h-dvh">
			{/* Desktop sidebar. Its dashed right edge is the rail the content sits against. */}
			<aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-dashed border-border bg-surface/40 py-5 lg:flex">
				<Brand />
				<div className="mt-7">{navBlock('nav-desktop')}</div>
				<div className="mt-auto pt-4">{accountBlock}</div>
			</aside>

			{/* Mobile top bar */}
			<header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-dashed border-border px-4 lg:hidden">
				<button onClick={() => setOpen(true)} aria-label="Open menu" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2">
					<IconMenu className="size-5" />
				</button>
				<span className="text-sm font-semibold">{title}</span>
				<div className="flex items-center">
					<ThemeToggle />
					<button onClick={logout} aria-label="Sign out" className="grid size-8 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-danger">
						<IconLogout className="size-[18px]" />
					</button>
				</div>
			</header>

			{/* Mobile drawer */}
			{open && (
				<div className="fixed inset-0 z-40 lg:hidden">
					<div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
					<div className="animate-in absolute inset-y-0 left-0 flex w-64 flex-col border-r border-dashed border-border bg-bg py-5">
						<div className="flex items-center justify-between pr-3">
							<Brand />
							<button onClick={() => setOpen(false)} aria-label="Close menu" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2">
								<IconX className="size-5" />
							</button>
						</div>
						<div className="mt-7">{navBlock('nav-mobile', () => setOpen(false))}</div>
						<div className="mt-auto pt-4">{accountBlock}</div>
					</div>
				</div>
			)}

			{/* Content */}
			<main className="lg:pl-60">
				<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
					<Suspense fallback={<RouteSkeleton />}>
						<AnimatePresence mode="wait">
							<motion.div
								key={loc.pathname}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								transition={{ duration: 0.2, ease: 'easeOut' }}
							>
								<Outlet />
							</motion.div>
						</AnimatePresence>
					</Suspense>
				</div>
			</main>
		</div>
	);
}

/** Shown while a route's chunk is still downloading. Deliberately generic: it has to
 *  stand in for any page, so it shows a header, a stat row and a list. */
function RouteSkeleton() {
	return (
		<Skeletons label="Loading page">
			<div className="mb-6">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="mt-2 h-3 w-64" />
			</div>
			<SkeletonStats />
			<div className="mt-4 rounded-xl border border-border bg-surface">
				<SkeletonRows rows={5} />
			</div>
		</Skeletons>
	);
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
	return (
		<div className="mb-6 flex flex-wrap items-end justify-between gap-3">
			<div>
				<h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h1>
				{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
			</div>
			{action}
		</div>
	);
}

export { Button };
