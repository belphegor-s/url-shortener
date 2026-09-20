import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PageHeader } from '../components/Layout';
import { Card, Badge, SkeletonRows, Skeletons, EmptyState } from '../components/ui';
import { IconUsers, IconGithub } from '../components/icons';
import { full, fmtDate, relative } from '../lib/format';

export default function Users() {
	const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: api.users });

	return (
		<div>
			<PageHeader title="Users" subtitle="Every account on the platform" />

			{isLoading ? (
				<Skeletons label="Loading users">
					<Card className="overflow-hidden">
						<SkeletonRows rows={6} leading columns={4} />
					</Card>
				</Skeletons>
			) : !data || data.data.length === 0 ? (
				<Card>
					<EmptyState icon={<IconUsers className="size-5" />} title="No users yet" />
				</Card>
			) : (
				<Card className="overflow-hidden">
					<div className="hidden grid-cols-[minmax(0,1fr)_90px_90px_130px] items-center gap-3 border-b border-border px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-faint sm:grid">
						<span>Account</span>
						<span className="text-right">Links</span>
						<span className="text-right">Clicks</span>
						<span>Last seen</span>
					</div>
					<div className="divide-y divide-border">
						{data.data.map((u) => (
							<div key={u.id} className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_90px_90px_130px] sm:items-center sm:gap-3">
								<div className="flex min-w-0 items-center gap-3">
									{u.avatar_url ? (
										<img src={u.avatar_url} alt="" width={34} height={34} className="size-[34px] shrink-0 rounded-full border border-border" referrerPolicy="no-referrer" />
									) : (
										<div className="grid size-[34px] shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
											{u.login[0]?.toUpperCase()}
										</div>
									)}
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="truncate text-sm font-medium text-fg">{u.name || u.login}</span>
											{u.role === 'admin' && <Badge tone="accent">admin</Badge>}
										</div>
										<div className="flex items-center gap-1 truncate text-[12px] text-muted">
											<IconGithub className="size-3 shrink-0 text-faint" />
											<a href={`https://github.com/${u.login}`} target="_blank" rel="noreferrer" className="truncate hover:text-fg">
												@{u.login}
											</a>
										</div>
									</div>
								</div>
								<div className="tabular text-sm text-fg sm:text-right">
									<span className="text-faint sm:hidden">Links: </span>
									{full(u.links)} <span className="text-faint">({full(u.active_links)} active)</span>
								</div>
								<div className="tabular text-sm font-medium text-fg sm:text-right">
									<span className="text-faint sm:hidden">Clicks: </span>
									{full(u.clicks)}
								</div>
								<div className="text-[13px] text-muted" title={fmtDate(u.last_login)}>
									{relative(u.last_login)}
								</div>
							</div>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}
