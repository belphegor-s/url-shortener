import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PageHeader } from '../components/Layout';
import { Card, Skeleton, EmptyState } from '../components/ui';
import { TrendChart, BarList } from '../components/charts';
import { compact, full, hostOf } from '../lib/format';
import { Flag } from '../components/Flag';
import { IconChart, IconGlobe, IconLink } from '../components/icons';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
	return (
		<Card className="relative overflow-hidden p-4">
			<div className="accent-glow pointer-events-none absolute inset-0 opacity-60" />
			<div className="relative">
				<div className="text-[12px] font-medium uppercase tracking-wide text-faint">{label}</div>
				<div className="tabular mt-2 text-2xl font-semibold text-fg sm:text-[28px]">{value}</div>
				{sub && <div className="mt-1 text-[12px] text-muted">{sub}</div>}
			</div>
		</Card>
	);
}

export default function Overview() {
	const { data, isLoading } = useQuery({ queryKey: ['overview'], queryFn: api.overview });

	if (isLoading || !data) return <OverviewSkeleton />;
	const t = data.totals;

	return (
		<div>
			<PageHeader title="Overview" subtitle="Traffic across all your short links" />

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<Stat label="Total clicks" value={full(t.clicks)} sub={`${compact(t.clicks_7d)} in last 7 days`} />
				<Stat label="Last 24h" value={full(t.clicks_24h)} />
				<Stat label="Links" value={full(t.links)} sub={`${full(t.active_links)} active`} />
				<Stat label="Avg / link" value={t.links ? compact(Math.round(t.clicks / t.links)) : '0'} />
			</div>

			<Card className="mt-4 p-4 sm:p-5">
				<div className="mb-3 flex items-center justify-between">
					<h2 className="text-sm font-semibold text-fg">Clicks · last 30 days</h2>
				</div>
				<TrendChart series={data.series} />
			</Card>

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
		</div>
	);
}

function Panel({ title, children, empty, emptyIcon }: { title: string; children: React.ReactNode; empty: boolean; emptyIcon: React.ReactNode }) {
	return (
		<Card className="p-4">
			<h2 className="mb-3 px-1 text-sm font-semibold text-fg">{title}</h2>
			{empty ? <EmptyState icon={emptyIcon} title="No data yet" /> : children}
		</Card>
	);
}

function OverviewSkeleton() {
	return (
		<div>
			<Skeleton className="mb-6 h-8 w-40" />
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-24" />
				))}
			</div>
			<Skeleton className="mt-4 h-64" />
			<div className="mt-4 grid gap-4 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-56" />
				))}
			</div>
		</div>
	);
}
