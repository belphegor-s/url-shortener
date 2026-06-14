import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, ApiError, type LinkRow } from '../lib/api';
import { PageHeader } from '../components/Layout';
import { motion } from 'motion/react';
import { Button, Card, Input, Badge, Checkbox, CopyButton, Spinner, EmptyState, ConfirmDialog, cx } from '../components/ui';
import { Modal } from '../components/Modal';
import { IconSearch, IconPlus, IconTrash, IconLink, IconExternal, IconChevron, IconX, IconPower } from '../components/icons';
import { full, fmtDate, relative, hostOf } from '../lib/format';

function useDebounced<T>(value: T, ms = 300): T {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
}

const SORTS = [
	{ key: 'created', label: 'Newest' },
	{ key: 'clicks', label: 'Most clicks' },
	{ key: 'last', label: 'Last clicked' },
];

export default function Links() {
	const qc = useQueryClient();
	const navigate = useNavigate();
	const [search, setSearch] = useState('');
	const q = useDebounced(search);
	const [page, setPage] = useState(1);
	const [sort, setSort] = useState('created');
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [createOpen, setCreateOpen] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
	const limit = 20;

	useEffect(() => setPage(1), [q, sort]);

	const { data, isFetching } = useQuery({
		queryKey: ['links', q, page, sort],
		queryFn: () => api.links({ q, page, limit, sort, dir: 'desc' }),
		placeholderData: keepPreviousData,
	});

	const invalidate = () => {
		qc.invalidateQueries({ queryKey: ['links'] });
		qc.invalidateQueries({ queryKey: ['overview'] });
	};

	const del = useMutation({
		mutationFn: (ids: string[]) => api.deleteLinks(ids),
		onSuccess: () => {
			setSelected(new Set());
			setPendingDelete(null);
			invalidate();
		},
	});
	const toggle = useMutation({
		mutationFn: ({ id, active }: { id: string; active: boolean }) => api.updateLink(id, { active }),
		onSuccess: invalidate,
	});

	const rows = data?.data ?? [];
	const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;
	const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

	const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
	const toggleOne = (id: string) =>
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	return (
		<div>
			<PageHeader
				title="Links"
				subtitle={data ? `${full(data.total)} total` : ' '}
				action={
					<Button variant="primary" onClick={() => setCreateOpen(true)}>
						<IconPlus className="size-4" /> New link
					</Button>
				}
			/>

			{/* Controls */}
			<div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
					<Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code or destination…" className="pl-9" />
				</div>
				<div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
					{SORTS.map((s) => (
						<button
							key={s.key}
							onClick={() => setSort(s.key)}
							className={cx('relative rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors', sort === s.key ? 'text-fg' : 'text-muted hover:text-fg')}
						>
							{sort === s.key && (
								<motion.span
									layoutId="sortPill"
									className="absolute inset-0 rounded-md bg-surface-2 ring-1 ring-border"
									transition={{ type: 'spring', stiffness: 420, damping: 34 }}
								/>
							)}
							<span className="relative z-10">{s.label}</span>
						</button>
					))}
				</div>
			</div>

			{/* Batch action bar */}
			{selected.size > 0 && (
				<div className="mb-3 flex items-center justify-between rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-sm">
					<span className="text-fg">{selected.size} selected</span>
					<Button size="sm" variant="danger" onClick={() => setPendingDelete([...selected])}>
						<IconTrash className="size-3.5" /> Delete
					</Button>
				</div>
			)}

			<Card className="overflow-hidden">
				{/* Header row (desktop) */}
				<div className="hidden grid-cols-[28px_minmax(0,1fr)_90px_120px_110px_84px] items-center gap-3 border-b border-border px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-faint sm:grid">
					<Checkbox checked={allSelected} indeterminate={selected.size > 0 && !allSelected} onChange={toggleAll} />
					<span>Link</span>
					<span className="text-right">Clicks</span>
					<span>Created</span>
					<span>Status</span>
					<span className="text-right">Actions</span>
				</div>

				{!data ? (
					<div className="grid place-items-center py-20 text-muted">
						<Spinner className="size-5" />
					</div>
				) : rows.length === 0 ? (
					<EmptyState icon={<IconLink className="size-5" />} title="No links found" hint={q ? 'Try a different search.' : 'Create your first short link.'} />
				) : (
					<div className={cx('divide-y divide-border', isFetching && 'opacity-60 transition-opacity')}>
						{rows.map((r) => (
							<Row
								key={r.id}
								row={r}
								selected={selected.has(r.id)}
								onSelect={() => toggleOne(r.id)}
								onOpen={() => navigate(`/links/${r.id}`)}
								onToggle={() => toggle.mutate({ id: r.id, active: r.active === 0 })}
								onDelete={() => setPendingDelete([r.id])}
							/>
						))}
					</div>
				)}
			</Card>

			{/* Pagination */}
			{data && totalPages > 1 && (
				<div className="mt-4 flex items-center justify-between text-sm text-muted">
					<span>
						Page {page} of {totalPages}
					</span>
					<div className="flex gap-1.5">
						<Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
							Prev
						</Button>
						<Button size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
							Next
						</Button>
					</div>
				</div>
			)}

			<CreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={invalidate} />

			<ConfirmDialog
				open={pendingDelete !== null}
				title={pendingDelete && pendingDelete.length > 1 ? `Delete ${pendingDelete.length} links?` : 'Delete this link?'}
				message={
					pendingDelete && pendingDelete.length === 1 ? (
						<>
							<span className="font-mono text-fg">/{pendingDelete[0]}</span> and all its analytics will be permanently removed. This cannot be undone.
						</>
					) : (
						'These links and all their analytics will be permanently removed. This cannot be undone.'
					)
				}
				confirmLabel="Delete"
				loading={del.isPending}
				onConfirm={() => pendingDelete && del.mutate(pendingDelete)}
				onCancel={() => setPendingDelete(null)}
			/>
		</div>
	);
}

function Row({
	row,
	selected,
	onSelect,
	onOpen,
	onToggle,
	onDelete,
}: {
	row: LinkRow;
	selected: boolean;
	onSelect: () => void;
	onOpen: () => void;
	onToggle: () => void;
	onDelete: () => void;
}) {
	const expired = row.expires_at != null && Date.parse(row.expires_at) <= Date.now();
	const inactive = row.active === 0;
	return (
		<div
			className="group grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition hover:bg-surface-2/40 sm:grid-cols-[28px_minmax(0,1fr)_90px_120px_110px_84px]"
			onClick={onOpen}
		>
			<Checkbox checked={selected} onChange={onSelect} onClick={(e) => e.stopPropagation()} className="hidden sm:block" />
			<div className="min-w-0">
				<div className="flex items-center gap-1.5">
					<span className="font-mono text-[13px] font-medium text-fg">/{row.id}</span>
					<CopyButton value={`${location.origin}/${row.id}`} />
				</div>
				<div className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted">
					<IconExternal className="size-3 shrink-0 text-faint" />
					<span className="truncate">{hostOf(row.original_url)}</span>
				</div>
			</div>
			<div className="tabular hidden text-right text-sm font-medium text-fg sm:block">{full(row.click_count)}</div>
			<div className="hidden text-[13px] text-muted sm:block" title={row.last_clicked ? `Last click ${relative(row.last_clicked)}` : undefined}>
				{fmtDate(row.created_at)}
			</div>
			<div className="hidden sm:block">
				{expired ? <Badge tone="warn">Expired</Badge> : inactive ? <Badge tone="danger">Off</Badge> : <Badge tone="success">Active</Badge>}
			</div>
			<div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
				<button onClick={onToggle} title={inactive ? 'Enable' : 'Disable'} className={cx('grid size-7 place-items-center rounded-md hover:bg-surface-2', inactive ? 'text-faint' : 'text-success')}>
					<IconPower className="size-4" />
				</button>
				<button onClick={onDelete} title="Delete" className="grid size-7 place-items-center rounded-md text-faint hover:bg-danger/10 hover:text-danger">
					<IconTrash className="size-4" />
				</button>
				<IconChevron className="hidden size-4 text-faint sm:block" />
			</div>
		</div>
	);
}

function CreateDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
	const [url, setUrl] = useState('');
	const [customId, setCustomId] = useState('');
	const [expiresDays, setExpiresDays] = useState('');
	const [result, setResult] = useState<{ short_url: string } | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Reset the form each time the dialog opens.
	useEffect(() => {
		if (open) {
			setUrl('');
			setCustomId('');
			setExpiresDays('');
			setResult(null);
			setError(null);
		}
	}, [open]);

	const create = useMutation({
		mutationFn: () =>
			api.createLink({
				url: url.trim(),
				custom_id: customId.trim() || undefined,
				expires_in: expiresDays ? Number(expiresDays) * 86400 : undefined,
			}),
		onSuccess: (r) => {
			setResult(r);
			setError(null);
			onCreated();
		},
		onError: (e) => setError(e instanceof ApiError ? e.message : 'Failed to create'),
	});

	const submit = (e: FormEvent) => {
		e.preventDefault();
		create.mutate();
	};

	return (
		<Modal open={open} onClose={onClose} dismissable={!create.isPending} className="max-w-md">
			<Card className="p-5 shadow-2xl">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold">New short link</h2>
					<button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-fg">
						<IconX className="size-4" />
					</button>
				</div>

				{result ? (
					<div className="text-center">
						<div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm">
							<span className="truncate">{result.short_url}</span>
							<CopyButton value={result.short_url} />
						</div>
						<div className="mt-2 flex justify-center gap-2">
							<Button onClick={() => { setResult(null); setUrl(''); setCustomId(''); setExpiresDays(''); }}>Create another</Button>
							<Button variant="primary" onClick={onClose}>Done</Button>
						</div>
					</div>
				) : (
					<form onSubmit={submit}>
						<label className="mb-1.5 block text-[13px] font-medium text-muted">Destination URL</label>
						<Input value={url} onChange={(e) => setUrl(e.target.value)} autoFocus placeholder="https://example.com/page" className="mb-4" />

						<div className="mb-4 grid grid-cols-2 gap-3">
							<div>
								<label className="mb-1.5 block text-[13px] font-medium text-muted">Custom code <span className="text-faint">(optional)</span></label>
								<Input value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="my-code" />
							</div>
							<div>
								<label className="mb-1.5 block text-[13px] font-medium text-muted">Expires in <span className="text-faint">(days)</span></label>
								<Input value={expiresDays} onChange={(e) => setExpiresDays(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="∞" />
							</div>
						</div>

						{error && <p className="mb-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>}

						<div className="flex justify-end gap-2">
							<Button type="button" onClick={onClose}>Cancel</Button>
							<Button type="submit" variant="primary" loading={create.isPending} disabled={!url.trim()}>
								Create link
							</Button>
						</div>
					</form>
				)}
			</Card>
		</Modal>
	);
}
