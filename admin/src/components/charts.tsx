import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

export function TrendChart({ series, height = 220 }: { series: Point[]; height?: number }) {
	const data = densify(series);
	return (
		<ResponsiveContainer width="100%" height={height}>
			<AreaChart data={data} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
				<defs>
					<linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
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
								<div className="tabular font-semibold text-fg">{full(payload[0].value as number)} clicks</div>
							</div>
						) : null
					}
				/>
				<Area type="monotone" dataKey="clicks" stroke="var(--color-accent)" strokeWidth={2} fill="url(#trend)" />
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
		<div className={cx('flex flex-col', className)}>
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
