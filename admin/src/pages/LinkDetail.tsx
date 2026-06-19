import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, type ClickRecord } from '../lib/api';
import { Button, Card, Input, Badge, CopyButton, Spinner, EmptyState, ConfirmDialog, cx } from '../components/ui';
import { TrendChart, BarList } from '../components/charts';
import { IconSearch, IconExternal, IconTrash, IconPower, IconChevron, IconGlobe } from '../components/icons';
import { full, fmtDate, relative, hostOf, uaLabel } from '../lib/format';
import { Flag } from '../components/Flag';

function useDebounced<T>(value: T, ms = 300): T {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
}

export default function LinkDetail() {
	const { id = '' } = useParams();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const [search, setSearch] = useState('');
	const q = useDebounced(search);
	const [page, setPage] = useState(1);
	const [confirmDel, setConfirmDel] = useState(false);
	const limit = 25;

	useEffect(() => setPage(1), [q]);

	const { data, isFetching, isError } = useQuery({
		queryKey: ['link', id, q, page],
		queryFn: () => api.linkDetail(id, { q, page, limit }),
		placeholderData: keepPreviousData,
	});

	const invalidate = () => {
		qc.invalidateQueries({ queryKey: ['link', id] });
		qc.invalidateQueries({ queryKey: ['links'] });
		qc.invalidateQueries({ queryKey: ['overview'] });
	};
	const toggle = useMutation({ mutationFn: (active: boolean) => api.updateLink(id, { active }), onSuccess: invalidate });
	const del = useMutation({
		mutationFn: () => api.deleteLinks([id]),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['links'] });
			qc.invalidateQueries({ queryKey: ['overview'] });
			navigate('/links');
		},
	});

	if (isError) return <EmptyState title="Link not found" hint="It may have been deleted." />;
	if (!data) return <div className="grid place-items-center py-24 text-muted"><Spinner className="size-6" /></div>;

	const link = data.link;
	const expired = link.expires_at != null && Date.parse(link.expires_at) <= Date.now();
	const inactive = link.active === 0;
	const totalPages = Math.max(1, Math.ceil(data.total_records / limit));

	return (
		<div>
			{/* Breadcrumb */}
			<div className="mb-5 flex items-center gap-1.5 text-[13px] text-muted">
				<RouterLink to="/links" className="hover:text-fg">Links</RouterLink>
				<IconChevron className="size-3.5 text-faint" />
				<span className="font-mono text-fg">/{link.id}</span>
			</div>

			{/* Header card */}
			<Card className="relative overflow-hidden p-5">
				<div className="accent-glow pointer-events-none absolute inset-0 opacity-50" />
				<div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<a href={data.short_url} target="_blank" rel="noreferrer" className="font-mono text-lg font-semibold text-fg hover:text-accent">
								{data.short_url.replace(/^https?:\/\//, '')}
							</a>
							<CopyButton value={data.short_url} />
							{expired ? <Badge tone="warn">Expired</Badge> : inactive ? <Badge tone="danger">Off</Badge> : <Badge tone="success">Active</Badge>}
						</div>
						<a href={link.original_url} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1.5 text-sm text-muted hover:text-fg">
							<IconExternal className="size-3.5 shrink-0 text-faint" />
							<span className="truncate">{link.original_url}</span>
						</a>
						<div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-faint">
							<span>Created {fmtDate(link.created_at)}</span>
							<span>Expires {link.expires_at ? fmtDate(link.expires_at) : 'never'}</span>
						</div>
					</div>
					<div className="flex shrink-0 gap-2">
						<Button size="sm" onClick={() => toggle.mutate(inactive)} loading={toggle.isPending}>
							<IconPower className={cx('size-4', !inactive && 'text-success')} /> {inactive ? 'Enable' : 'Disable'}
						</Button>
						<Button size="sm" variant="danger" onClick={() => setConfirmDel(true)}>
							<IconTrash className="size-4" /> Delete
						</Button>
					</div>
				</div>
			</Card>

			{/* Stats + chart */}
			<div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
				<Card className="p-4 sm:p-5">
					<div className="mb-3 flex items-baseline justify-between">
						<h2 className="text-sm font-semibold text-fg">Clicks · last 30 days</h2>
						<span className="tabular text-2xl font-semibold text-fg">{full(data.total_records)}</span>
					</div>
					<TrendChart series={data.series} height={180} />
				</Card>
				<div className="grid gap-4">
					<Card className="p-4">
						<h2 className="mb-3 px-1 text-sm font-semibold text-fg">Countries</h2>
						{data.by_country.length === 0 ? (
							<EmptyState icon={<IconGlobe className="size-5" />} title="No data" />
						) : (
							<BarList items={data.by_country.map((c) => ({ label: c.country_code, leading: <Flag code={c.country_code} className="text-[17px]" />, value: c.clicks }))} />
						)}
					</Card>
				</div>
			</div>

			{/* Records */}
			<div className="mt-6">
				<div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h2 className="text-sm font-semibold text-fg">Records</h2>
					<div className="relative w-full sm:w-72">
						<IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
						<Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search IP, UA, country, referrer…" className="pl-9" />
					</div>
				</div>

				<Card className="overflow-hidden">
					<div className="hidden grid-cols-[150px_120px_1fr_1fr] gap-3 border-b border-border px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-faint sm:grid">
						<span>When</span>
						<span>Location</span>
						<span>Device</span>
						<span>Referrer</span>
					</div>
					{data.records.length === 0 ? (
						<EmptyState title="No clicks recorded" hint={q ? 'Try a different search.' : 'Clicks will appear here.'} />
					) : (
						<div className={cx('divide-y divide-border', isFetching && 'opacity-60')}>
							{data.records.map((r, i) => (
								<RecordRow key={i} r={r} />
							))}
						</div>
					)}
				</Card>

				{totalPages > 1 && (
					<div className="mt-4 flex items-center justify-between text-sm text-muted">
						<span>Page {page} of {totalPages}</span>
						<div className="flex gap-1.5">
							<Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
							<Button size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
						</div>
					</div>
				)}
			</div>

			<ConfirmDialog
				open={confirmDel}
				title="Delete this link?"
				message={
					<>
						<span className="font-mono text-fg">/{link.id}</span> and all its analytics will be permanently removed. This cannot be undone.
					</>
				}
				confirmLabel="Delete"
				loading={del.isPending}
				onConfirm={() => del.mutate()}
				onCancel={() => setConfirmDel(false)}
			/>
		</div>
	);
}

function RecordRow({ r }: { r: ClickRecord }) {
	return (
		<div className="grid grid-cols-1 gap-1 px-4 py-3 text-sm sm:grid-cols-[150px_120px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3">
			<div className="min-w-0 truncate text-fg" title={r.timestamp}>{relative(r.timestamp)}</div>
			<div className="flex min-w-0 items-center gap-1.5 text-muted">
				<Flag code={r.country_code} className="text-[15px]" />
				<span className="truncate font-mono text-[12px]">{r.ip || '—'}</span>
			</div>
			<div className="min-w-0 truncate text-muted" title={r.user_agent}>{uaLabel(r.user_agent)}</div>
			<div className="min-w-0 truncate text-muted" title={r.referrer}>{r.referrer ? hostOf(r.referrer) : <span className="text-faint">direct</span>}</div>
		</div>
	);
}
