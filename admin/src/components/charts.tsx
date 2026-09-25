import { useId } from 'react';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compact, full, fmtDate } from '../lib/format';
import { cx } from './ui';

interface Point {
	day: string;
	clicks: number;
}

/** Fill a sparse daily series with zeros so the trend line is continuous. */
function densify(series: Point[], days = 30): Point[] {
	const map = new Map(series.map((p) => [p.day, p.clicks]));
	const out: Point[] = [];
	const today = new Date();
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(today);
		d.setUTCDate(d.getUTCDate() - i);
		const key = d.toISOString().slice(0, 10);
		out.push({ day: key, clicks: map.get(key) ?? 0 });
	}
	return out;
}

export function TrendChart({ series, height = 220, unit = 'clicks' }: { series: Point[]; height?: number; unit?: string }) {
	const data = densify(series);
	// Several trend charts can share a page, so each needs its own gradient id.
	const gradient = `trend-${useId().replace(/:/g, '')}`;
	return (
		<ResponsiveContainer width="100%" height={height}>
			<AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
				<defs>
					<linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.45} />
						<stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
					</linearGradient>
				</defs>
				<XAxis
					dataKey="day"
					tickLine={false}
					axisLine={false}
					minTickGap={36}
					tick={{ fill: 'var(--color-faint)', fontSize: 11 }}
					tickFormatter={(d) => fmtDate(d).replace(/,.*/, '')}
				/>
				<YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: 'var(--color-faint)', fontSize: 11 }} tickFormatter={(v) => compact(v)} allowDecimals={false} />
				<Tooltip
					cursor={{ stroke: 'var(--color-border-strong)' }}
					content={({ active, payload, label }) =>
						active && payload?.length ? (
							<div className="rounded-lg border border-border-strong bg-elevated px-3 py-2 text-xs shadow-xl">
								<div className="mb-0.5 text-faint">{fmtDate(label)}</div>
								<div className="tabular font-semibold text-fg">
										{full(payload[0].value as number)} {unit}
									</div>
							</div>
						) : null
					}
				/>
				<Area type="monotone" dataKey="clicks" stroke="var(--color-accent)" strokeWidth={2} fill={`url(#${gradient})`} />
			</AreaChart>
		</ResponsiveContainer>
	);
}

interface BarItem {
	label: string;
	value: number;
	hint?: string;
	leading?: React.ReactNode;
}

export function BarList({ items, className }: { items: BarItem[]; className?: string }) {
	const max = Math.max(1, ...items.map((i) => i.value));
	return (
		<div className={cx('flex flex-col gap-1', className)}>
			{items.map((it, i) => (
				<div key={i} className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-2">
					<div
						className="absolute inset-y-0 left-0 rounded-md bg-accent/10 transition-all group-hover:bg-accent/15"
						style={{ width: `${(it.value / max) * 100}%` }}
					/>
					<div className="relative z-10 flex min-w-0 items-center gap-2">
						{it.leading}
						<span className="truncate text-[13px] text-fg">{it.label}</span>
						{it.hint && <span className="shrink-0 text-[11px] text-faint">{it.hint}</span>}
					</div>
					<span className="tabular relative z-10 shrink-0 text-[13px] font-medium text-muted">{full(it.value)}</span>
				</div>
			))}
		</div>
	);
}

/** 24 bars, one per UTC hour. Missing hours are zero. */
export function HourChart({ hourly, height = 180 }: { hourly: { hour: number; clicks: number }[]; height?: number }) {
	const map = new Map(hourly.map((h) => [h.hour, h.clicks]));
	const data = Array.from({ length: 24 }, (_, hour) => ({ hour, clicks: map.get(hour) ?? 0 }));
	const label = (h: number) => `${String(h).padStart(2, '0')}:00`;
	return (
		<ResponsiveContainer width="100%" height={height}>
			<BarChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
				<XAxis
					dataKey="hour"
					tickLine={false}
					axisLine={false}
					interval={5}
					tick={{ fill: 'var(--color-faint)', fontSize: 11 }}
					tickFormatter={label}
				/>
				<YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: 'var(--color-faint)', fontSize: 11 }} tickFormatter={(v) => compact(v)} allowDecimals={false} />
				<Tooltip
					cursor={{ fill: 'var(--color-surface-2)' }}
					content={({ active, payload, label: h }) =>
						active && payload?.length ? (
							<div className="rounded-lg border border-border-strong bg-elevated px-3 py-2 text-xs shadow-xl">
								<div className="mb-0.5 text-faint">
									{label(h as number)}-{label(((h as number) + 1) % 24)} UTC
								</div>
								<div className="tabular font-semibold text-fg">{full(payload[0].value as number)} clicks</div>
							</div>
						) : null
					}
				/>
				<Bar dataKey="clicks" fill="var(--color-accent)" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
			</BarChart>
		</ResponsiveContainer>
	);
}

// Monochrome steps of the accent: the palette is intentionally single-hue.
const SHARE_OPACITY = [0.9, 0.65, 0.45, 0.3, 0.2, 0.12];

/** One stacked proportion bar plus a legend with share percentages. */
export function ShareBar({ items }: { items: { label: string; value: number }[] }) {
	const total = items.reduce((sum, i) => sum + i.value, 0) || 1;
	const shown = items.slice(0, SHARE_OPACITY.length - 1);
	const rest = items.slice(SHARE_OPACITY.length - 1).reduce((sum, i) => sum + i.value, 0);
	const rows = rest ? [...shown, { label: 'Other', value: rest }] : shown;
	const pct = (v: number) => `${((v / total) * 100).toFixed(v / total < 0.1 ? 1 : 0)}%`;
	return (
		<div>
			<div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
				{rows.map((r, i) => (
					<div
						key={r.label}
						title={`${r.label}: ${pct(r.value)}`}
						className="h-full border-r border-surface last:border-r-0"
						style={{ width: `${(r.value / total) * 100}%`, background: 'var(--color-accent)', opacity: SHARE_OPACITY[i] }}
					/>
				))}
			</div>
			<ul className="mt-4 flex flex-col gap-2">
				{rows.map((r, i) => (
					<li key={r.label} className="flex items-center justify-between gap-3 text-[13px]">
						<span className="flex min-w-0 items-center gap-2">
							<span className="size-2.5 shrink-0 rounded-sm" style={{ background: 'var(--color-accent)', opacity: SHARE_OPACITY[i] }} />
							<span className="truncate text-fg">{r.label}</span>
						</span>
						<span className="tabular shrink-0 text-muted">
							{full(r.value)} <span className="text-faint">· {pct(r.value)}</span>
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
