import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, type Scope, type PlatformStats } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader } from '../components/Layout';
import { Card, Segmented, Skeleton, SkeletonChart, SkeletonStats, Skeletons, EmptyState, cx } from '../components/ui';
import { TrendChart, BarList, HourChart, ShareBar } from '../components/charts';
import { compact, full, hostOf } from '../lib/format';
import { Flag } from '../components/Flag';
import { IconChart, IconGlobe, IconLink, IconUsers, IconDevices } from '../components/icons';
import { useFilters } from '../lib/filters';

const FILTERS = { scope: 'mine' };

function Stat({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: number | null }) {
	return (
		<Card className="p-4">
			<div className="text-[12px] font-medium uppercase tracking-wide text-faint">{label}</div>
			<div className="tabular mt-2 text-2xl font-semibold text-fg sm:text-[28px]">{value}</div>
			{(sub || delta != null) && (
				<div className="mt-1 text-[12px] text-muted">
					{delta != null && (
						<span className={cx('tabular font-medium', delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-faint')}>
							{delta > 0 ? '+' : ''}
							{delta}%{' '}
						</span>
					)}
					{sub}
				</div>
			)}
		</Card>
	);
}

/** Week-over-week change as a whole percentage; null when there is no baseline. */
const change = (current: number, previous: number): number | null => (previous ? Math.round(((current - previous) / previous) * 100) : null);

export default function Overview() {
	const { user } = useAuth();
	const [filters, setFilters] = useFilters(FILTERS);
	const scope = filters.scope as Scope;
	const setScope = (scope: Scope) => setFilters({ scope });
	const { data, isLoading } = useQuery({ queryKey: ['overview', scope], queryFn: () => api.overview(scope) });

	if (isLoading || !data) return <OverviewSkeleton />;
	const t = data.totals;
	const all = scope === 'all';

	return (
		<div>
			<PageHeader
				title="Overview"
				subtitle={all ? 'Platform-wide traffic across every account' : 'Traffic across all your short links'}
				action={user?.role === 'admin' ? <ScopeToggle scope={scope} onChange={setScope} /> : undefined}
			/>

			{data.platform && <PlatformSection platform={data.platform} />}

			{data.platform && <SectionLabel className="mt-8">Traffic</SectionLabel>}
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<Stat label="Total clicks" value={full(t.clicks)} sub={`${t.links ? compact(Math.round(t.clicks / t.links)) : '0'} avg per link`} />
				<Stat
					label="Last 7 days"
					value={full(t.clicks_7d)}
					delta={change(t.clicks_7d, t.clicks_prev_7d)}
					sub={t.clicks_prev_7d ? 'vs previous 7 days' : 'no prior week to compare'}
				/>
				<Stat label="Last 24h" value={full(t.clicks_24h)} />
				<Stat label="Links" value={full(t.links)} sub={`${full(t.active_links)} active`} />
			</div>

			<Card className="mt-4 p-4 sm:p-5">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-sm font-semibold text-fg">Clicks · last 30 days</h2>
				</div>
				<TrendChart series={data.series} />
			</Card>

			<div className="mt-4 grid gap-4 lg:grid-cols-2">
				<Card className="p-4 sm:p-5">
					<h2 className="mb-3 text-sm font-semibold text-fg">Links created · last 30 days</h2>
					<TrendChart series={data.link_series} height={180} unit="links" />
				</Card>
				<Card className="p-4 sm:p-5">
					<h2 className="mb-3 text-sm font-semibold text-fg">Clicks by hour · UTC, last 30 days</h2>
					<HourChart hourly={data.hourly} />
				</Card>
			</div>

			<div className="mt-4 grid gap-4 lg:grid-cols-3">
				<Panel title="Top links" empty={data.top_links.length === 0} emptyIcon={<IconLink className="size-5" />}>
					<BarList
						items={data.top_links.map((l) => ({
							label: l.id,
							hint: hostOf(l.original_url),
							value: l.clicks,
						}))}
					/>
				</Panel>
				<Panel title="Top countries" empty={data.top_countries.length === 0} emptyIcon={<IconGlobe className="size-5" />}>
					<BarList
						items={data.top_countries.map((c) => ({
							label: c.country_code,
							leading: <Flag code={c.country_code} className="text-[17px]" />,
							value: c.clicks,
						}))}
					/>
				</Panel>
				<Panel title="Top referrers" empty={data.top_referrers.length === 0} emptyIcon={<IconChart className="size-5" />}>
					<BarList items={data.top_referrers.map((r) => ({ label: hostOf(r.referrer), value: r.clicks }))} />
				</Panel>
			</div>

			<div className="mt-4 grid gap-4 lg:grid-cols-3">
				<Panel title="Browsers" empty={data.browsers.length === 0} emptyIcon={<IconDevices className="size-5" />}>
					<ShareBar items={data.browsers.map((b) => ({ label: b.label, value: b.clicks }))} />
				</Panel>
				<Panel title="Operating systems" empty={data.os.length === 0} emptyIcon={<IconDevices className="size-5" />}>
					<ShareBar items={data.os.map((o) => ({ label: o.label, value: o.clicks }))} />
				</Panel>
				<Panel title="Top destinations" empty={data.top_destinations.length === 0} emptyIcon={<IconLink className="size-5" />}>
					<BarList items={data.top_destinations.map((d) => ({ label: d.host.replace(/^www\./, ''), hint: 'links', value: d.links }))} />
				</Panel>
			</div>
		</div>
	);
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
	return <h2 className={cx('mb-3 text-[12px] font-medium uppercase tracking-wide text-faint', className)}>{children}</h2>;
}

/** Admin-only account stats, shown above traffic when viewing every account. */
function PlatformSection({ platform }: { platform: PlatformStats }) {
	const p = platform.totals;
	return (
		<section>
			<SectionLabel>Platform</SectionLabel>
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<Stat label="Users" value={full(p.users)} sub={`${full(p.admins)} admin · ${full(p.users_with_links)} with links`} />
				<Stat label="Active 7d" value={full(p.active_users_7d)} sub={`${full(p.new_users_7d)} new this week`} />
				<Stat label="Links 7d" value={full(p.links_7d)} sub={`${full(p.expired_links)} expired · ${full(p.anonymous_links)} anonymous`} />
				<Stat label="API keys" value={full(p.api_keys)} sub={`${full(p.active_sessions)} live sessions`} />
			</div>

			<div className="mt-4 grid gap-4 lg:grid-cols-2">
				<Card className="p-4 sm:p-5">
					<h2 className="mb-3 text-sm font-semibold text-fg">Sign-ups · last 30 days</h2>
					<TrendChart series={platform.signups} height={200} unit="sign-ups" />
				</Card>
				<Panel
					title="Top users by clicks"
					empty={platform.top_users.length === 0}
					emptyIcon={<IconUsers className="size-5" />}
					action={
						<Link to="/users" className="text-[12px] text-muted hover:text-fg">
							All users
						</Link>
					}
				>
					<BarList
						items={platform.top_users.map((u) => ({
							label: u.name || u.login,
							hint: `${full(u.links)} links`,
							leading: u.avatar_url ? (
								<img src={u.avatar_url} alt="" width={18} height={18} className="size-[18px] shrink-0 rounded-full" referrerPolicy="no-referrer" />
							) : (
								<span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-muted">
									{u.login[0]?.toUpperCase()}
								</span>
							),
							value: u.clicks,
						}))}
					/>
				</Panel>
			</div>
		</section>
	);
}

function Panel({
	title,
	children,
	empty,
	emptyIcon,
	action,
}: {
	title: string;
	children: React.ReactNode;
	empty: boolean;
	emptyIcon: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<Card className="p-4">
			<div className="mb-3 flex items-center justify-between gap-2 px-1">
				<h2 className="text-sm font-semibold text-fg">{title}</h2>
				{action}
			</div>
			{empty ? <EmptyState icon={emptyIcon} title="No data yet" /> : children}
		</Card>
	);
}

export function ScopeToggle({ scope, onChange }: { scope: Scope; onChange: (s: Scope) => void }) {
	return (
		<Segmented
			layoutId="scope"
			value={scope}
			onChange={onChange}
			options={[
				{ value: 'mine', label: 'My links' },
				{ value: 'all', label: 'All users' },
			]}
		/>
	);
}

/** Mirrors the real Overview: header, stat row, trend chart, three bar-list panels. */
function OverviewSkeleton() {
	return (
		<Skeletons label="Loading overview">
			<div className="mb-6">
				<Skeleton className="h-6 w-32" />
				<Skeleton className="mt-2 h-3 w-60" />
			</div>
			<SkeletonStats />
			<SkeletonChart className="mt-4" />
			<div className="mt-4 grid gap-4 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, panel) => (
					<Card key={panel} className="p-4">
						<Skeleton className="h-3 w-28" />
						<div className="mt-4 flex flex-col gap-3.5">
							{[92, 74, 58, 43, 30].map((width, row) => (
								<div key={row}>
									<div className="flex items-center justify-between gap-3">
										<Skeleton className="h-2.5 w-24" />
										<Skeleton className="h-2.5 w-8" />
									</div>
									<Skeleton className="mt-2 h-1.5 rounded-full" style={{ width: `${width}%` }} />
								</div>
							))}
						</div>
					</Card>
				))}
			</div>
		</Skeletons>
	);
}
