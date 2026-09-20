import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type SessionRow } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader } from '../components/Layout';
import { useState } from 'react';
import { Button, Card, Badge, Skeleton, Skeletons, EmptyState, ConfirmDialog, cx } from '../components/ui';
import { IconUsers, IconGlobe } from '../components/icons';
import { fmtDate, relative, uaLabel } from '../lib/format';
import { Flag } from '../components/Flag';

export default function Sessions() {
	const qc = useQueryClient();
	const { logout } = useAuth();
	const [pending, setPending] = useState<SessionRow | null>(null);
	const { data, isLoading } = useQuery({ queryKey: ['sessions'], queryFn: api.sessions });

	const revoke = useMutation({
		mutationFn: (s: SessionRow) => api.revokeSession(s.id),
		onSuccess: (_r, s) => {
			setPending(null);
			if (s.current) logout();
			else qc.invalidateQueries({ queryKey: ['sessions'] });
		},
	});

	return (
		<div>
			<PageHeader title="Sessions" subtitle="Devices currently signed in to this account" />

			{isLoading ? (
				<SessionsSkeleton />
			) : !data || data.data.length === 0 ? (
				<Card>
					<EmptyState icon={<IconUsers className="size-5" />} title="No active sessions" />
				</Card>
			) : (
				<div className="grid gap-3">
					{data.data.map((s) => (
						<Card key={s.id} className={cx('flex flex-col gap-3 p-4 sm:flex-row sm:items-center', s.current && 'border-accent/30')}>
							<div className="flex min-w-0 flex-1 items-start gap-3">
								<div className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface-2"><Flag code={s.country_code} className="text-[20px]" /></div>
								<div className="min-w-0 flex-1">
									<div className="flex min-w-0 items-center gap-2">
										<span className="truncate text-sm font-medium text-fg">{uaLabel(s.user_agent)}</span>
										{s.current && <Badge tone="accent">This device</Badge>}
									</div>
									<div className="mt-1 space-y-0.5 text-[12px] text-muted">
										<div className="flex min-w-0 items-center gap-1">
											<IconGlobe className="size-3 shrink-0 text-faint" />
											<span className="truncate font-mono">{s.ip || 'unknown'}</span>
										</div>
										<div className="truncate">
											Active {relative(s.last_seen)} <span className="text-faint">· Signed in {fmtDate(s.created_at)}</span>
										</div>
									</div>
								</div>
							</div>
							<Button
								size="sm"
								variant={s.current ? 'default' : 'danger'}
								onClick={() => setPending(s)}
								className="w-full shrink-0 sm:w-auto"
							>
								{s.current ? 'Sign out' : 'Revoke'}
							</Button>
						</Card>
					))}
				</div>
			)}

			<ConfirmDialog
				open={pending !== null}
				title={pending?.current ? 'Sign out this device?' : 'Revoke this session?'}
				message={
					pending?.current
						? 'You will be signed out and returned to the login screen.'
						: 'This device will be signed out immediately and will need to log in again.'
				}
				confirmLabel={pending?.current ? 'Sign out' : 'Revoke'}
				loading={revoke.isPending}
				onConfirm={() => pending && revoke.mutate(pending)}
				onCancel={() => setPending(null)}
			/>
		</div>
	);
}

/** Mirrors the session cards: flag tile, device line, meta lines, revoke button. */
function SessionsSkeleton() {
	return (
		<Skeletons label="Loading sessions">
			<div className="grid gap-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<Card key={i} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
						<div className="flex min-w-0 flex-1 items-start gap-3">
							<Skeleton className="size-10 shrink-0 rounded-xl" />
							<div className="min-w-0 flex-1">
								<Skeleton className="h-3.5 w-44" />
								<Skeleton className="mt-2.5 h-2.5 w-28" />
								<Skeleton className="mt-2 h-2.5 w-52" />
							</div>
						</div>
						<Skeleton className="h-8 w-20 rounded-lg" />
					</Card>
				))}
			</div>
		</Skeletons>
	);
}
