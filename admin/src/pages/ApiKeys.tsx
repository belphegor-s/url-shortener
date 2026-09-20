import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, type ApiKeyRow } from '../lib/api';
import { PageHeader } from '../components/Layout';
import { Button, Card, Input, Badge, CopyButton, SkeletonRows, Skeletons, EmptyState, ConfirmDialog } from '../components/ui';
import { Modal } from '../components/Modal';
import { IconKey, IconPlus, IconTrash, IconX } from '../components/icons';
import { fmtDate, relative } from '../lib/format';

export default function ApiKeys() {
	const qc = useQueryClient();
	const [createOpen, setCreateOpen] = useState(false);
	const [pending, setPending] = useState<ApiKeyRow | null>(null);
	const { data, isLoading } = useQuery({ queryKey: ['keys'], queryFn: api.keys });

	const revoke = useMutation({
		mutationFn: (k: ApiKeyRow) => api.revokeKey(k.id),
		onSuccess: () => {
			setPending(null);
			qc.invalidateQueries({ queryKey: ['keys'] });
		},
	});

	return (
		<div>
			<PageHeader
				title="API keys"
				subtitle="Programmatic access to your links and analytics"
				action={
					<Button variant="primary" onClick={() => setCreateOpen(true)}>
						<IconPlus className="size-4" /> New key
					</Button>
				}
			/>

			{isLoading ? (
				<Skeletons label="Loading API keys">
					<Card className="overflow-hidden">
						<SkeletonRows rows={4} columns={3} />
					</Card>
				</Skeletons>
			) : !data || data.data.length === 0 ? (
				<Card>
					<EmptyState icon={<IconKey className="size-5" />} title="No API keys yet" hint="Create a key to use the programmatic API from your own scripts and services." />
				</Card>
			) : (
				<Card className="overflow-hidden">
					<div className="hidden grid-cols-[minmax(0,1fr)_120px_130px_84px] items-center gap-3 border-b border-border px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-faint sm:grid">
						<span>Key</span>
						<span>Created</span>
						<span>Last used</span>
						<span className="text-right">Actions</span>
					</div>
					<div className="divide-y divide-border">
						{data.data.map((k) => (
							<div key={k.id} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_120px_130px_84px] sm:items-center sm:gap-3">
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<span className="truncate font-mono text-[13px] text-fg">{k.prefix}…</span>
										{k.name && <Badge tone="muted">{k.name}</Badge>}
									</div>
								</div>
								<div className="text-[13px] text-muted">{fmtDate(k.created_at)}</div>
								<div className="text-[13px] text-muted">{k.last_used_at ? relative(k.last_used_at) : <span className="text-faint">Never</span>}</div>
								<div className="flex justify-end sm:justify-end">
									<button
										onClick={() => setPending(k)}
										title="Revoke"
										className="grid size-7 place-items-center rounded-md text-faint hover:bg-danger/10 hover:text-danger"
									>
										<IconTrash className="size-4" />
									</button>
								</div>
							</div>
						))}
					</div>
				</Card>
			)}

			<CreateKeyDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => qc.invalidateQueries({ queryKey: ['keys'] })} />

			<ConfirmDialog
				open={pending !== null}
				title="Revoke this API key?"
				message={
					<>
						<span className="font-mono text-fg">{pending?.prefix}…</span> will stop working immediately. Services using it will get a 401.
					</>
				}
				confirmLabel="Revoke"
				loading={revoke.isPending}
				onConfirm={() => pending && revoke.mutate(pending)}
				onCancel={() => setPending(null)}
			/>
		</div>
	);
}

function CreateKeyDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
	const [name, setName] = useState('');
	const [created, setCreated] = useState<{ key: string } | null>(null);
	const [error, setError] = useState<string | null>(null);

	const create = useMutation({
		mutationFn: () => api.createKey(name.trim() || undefined),
		onSuccess: (r) => {
			setCreated(r);
			setError(null);
			onCreated();
		},
		onError: (e) => setError(e instanceof ApiError ? e.message : 'Failed to create key'),
	});

	const close = () => {
		setName('');
		setCreated(null);
		setError(null);
		onClose();
	};

	const origin = typeof location !== 'undefined' ? location.origin : '';

	return (
		<Modal open={open} onClose={close} dismissable={!create.isPending} className="max-w-md">
			<Card className="p-5 shadow-2xl">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold">New API key</h2>
					<button onClick={close} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-fg">
						<IconX className="size-4" />
					</button>
				</div>

				{created ? (
					<div>
						<p className="mb-3 rounded-lg border border-warn/25 bg-warn/10 px-3 py-2 text-[13px] text-warn">Copy this key now - it will never be shown again.</p>
						<div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
							<code className="min-w-0 flex-1 truncate font-mono text-[13px] text-fg">{created.key}</code>
							<CopyButton value={created.key} />
						</div>
						<pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-bg p-3 font-mono text-[12px] leading-relaxed text-muted">{`curl -X POST ${origin}/create \\
  -H "Authorization: Bearer ${created.key}" \\
  -H "content-type: application/json" \\
  -d '{"url":"https://example.com"}'`}</pre>
						<div className="flex justify-end">
							<Button variant="primary" onClick={close}>
								Done
							</Button>
						</div>
					</div>
				) : (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							create.mutate();
						}}
					>
						<label className="mb-1.5 block text-[13px] font-medium text-muted">
							Name <span className="text-faint">(optional)</span>
						</label>
						<Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="CI deploy" className="mb-1.5" />
						<p className="mb-4 text-[12px] text-faint">A label so you can recognise the key later.</p>

						{error && <p className="mb-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>}

						<div className="flex justify-end gap-2">
							<Button type="button" onClick={close}>
								Cancel
							</Button>
							<Button type="submit" variant="primary" loading={create.isPending}>
								Create key
							</Button>
						</div>
					</form>
				)}
			</Card>
		</Modal>
	);
}
