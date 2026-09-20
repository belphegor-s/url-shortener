import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { Button, Spinner, Badge, cx } from './ui';
import { IconChart, IconLink, IconUsers, IconKey, IconLogout, IconMenu, IconX } from './icons';

const NAV = [
	{ to: '/', label: 'Overview', icon: IconChart, end: true },
	{ to: '/links', label: 'Links', icon: IconLink, end: false },
	{ to: '/keys', label: 'API keys', icon: IconKey, end: false },
	{ to: '/sessions', label: 'Sessions', icon: IconUsers, end: false },
];

const ADMIN_NAV = [{ to: '/users', label: 'Users', icon: IconUsers, end: false }];

function NavItems({ onNavigate, indicatorId, admin }: { onNavigate?: () => void; indicatorId: string; admin: boolean }) {
	const items = admin ? [...NAV, ...ADMIN_NAV] : NAV;
	return (
		<nav className="flex flex-col gap-1">
			{items.map(({ to, label, icon: Icon, end }) => (
				<NavLink
					key={to}
					to={to}
					end={end}
					onClick={onNavigate}
					className={({ isActive }) =>
						cx(
							'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
							isActive ? 'text-fg' : 'text-muted hover:bg-surface-2/60 hover:text-fg'
						)
					}
				>
					{({ isActive }) => (
						<>
							{isActive && (
								<motion.span
									layoutId={indicatorId}
									className="absolute inset-0 rounded-lg bg-surface-2 ring-1 ring-border"
									transition={{ type: 'spring', stiffness: 380, damping: 32 }}
								/>
							)}
							<Icon className="relative z-10 size-[18px]" />
							<span className="relative z-10">{label}</span>
						</>
					)}
				</NavLink>
			))}
		</nav>
	);
}

function Brand() {
	return (
		<div className="flex items-center gap-2.5 px-3">
			<div className="grid size-7 place-items-center rounded-lg bg-accent text-accent-fg">
				<IconLink className="size-4" />
			</div>
			<div className="leading-tight">
				<div className="text-sm font-semibold text-fg">SHRT</div>
				<div className="text-[11px] text-faint">dashboard</div>
			</div>
		</div>
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
		<div className="flex min-w-0 items-center gap-2">
			{user?.avatarUrl ? (
				<img src={user.avatarUrl} alt="" width={28} height={28} className="size-7 rounded-full border border-border" referrerPolicy="no-referrer" />
			) : (
				<div className="grid size-7 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">{user?.login?.[0]?.toUpperCase() ?? '?'}</div>
			)}
			<div className="min-w-0 leading-tight">
				<div className="flex items-center gap-1.5">
					<span className="truncate text-sm text-fg">{user?.name || user?.login}</span>
					{admin && <Badge tone="accent">admin</Badge>}
				</div>
				<div className="truncate text-[11px] text-faint">@{user?.login}</div>
			</div>
		</div>
	);

	return (
		<div className="min-h-dvh">
			{/* Desktop sidebar */}
			<aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-surface/40 px-3 py-5 lg:flex">
				<Brand />
				<div className="mt-7 px-0">
					<NavItems indicatorId="nav-desktop" admin={admin} />
				</div>
				<div className="mt-auto border-t border-border px-1 pt-4">
					<div className="flex items-center justify-between gap-2 px-2">
						{identity}
						<button onClick={logout} title="Sign out" className="grid size-8 shrink-0 place-items-center rounded-lg text-faint transition hover:bg-surface-2 hover:text-danger">
							<IconLogout className="size-[18px]" />
						</button>
					</div>
				</div>
			</aside>

			{/* Mobile top bar */}
			<header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
				<button onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2">
					<IconMenu className="size-5" />
				</button>
				<span className="text-sm font-semibold">{title}</span>
				<button onClick={logout} className="grid size-9 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-danger">
					<IconLogout className="size-[18px]" />
				</button>
			</header>

			{/* Mobile drawer */}
			{open && (
				<div className="fixed inset-0 z-40 lg:hidden">
					<div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
					<div className="absolute inset-y-0 left-0 w-64 animate-in border-r border-border bg-surface px-3 py-5">
						<div className="flex items-center justify-between">
							<Brand />
							<button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2">
								<IconX className="size-5" />
							</button>
						</div>
						<div className="mt-7">
							<NavItems onNavigate={() => setOpen(false)} indicatorId="nav-mobile" admin={admin} />
						</div>
						<div className="mt-6 border-t border-border pt-4">{identity}</div>
					</div>
				</div>
			)}

			{/* Content */}
			<main className="lg:pl-60">
				<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
					<Suspense fallback={<div className="grid place-items-center py-24 text-muted"><Spinner className="size-6" /></div>}>
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

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
	return (
		<div className="mb-6 flex items-end justify-between gap-4">
			<div>
				<h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h1>
				{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
			</div>
			{action}
		</div>
	);
}

export { Button };
