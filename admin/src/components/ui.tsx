import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { IconCopy, IconCheck } from './icons';
import { Modal } from './Modal';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export function Card({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={cx('rounded-xl border border-border bg-surface', className)}>{children}</div>;
}

export function Button({
	variant = 'default',
	size = 'md',
	loading,
	className,
	children,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; loading?: boolean }) {
	const variants = {
		default: 'bg-surface hover:bg-surface-2 border border-border text-fg',
		primary: 'bg-accent hover:opacity-90 text-accent-fg border border-transparent',
		ghost: 'hover:bg-surface-2 text-muted hover:text-fg border border-transparent',
		danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/25',
	};
	const sizes = { sm: 'h-8 px-3 text-[13px]', md: 'h-9 px-4 text-sm' };
	return (
		<button
			className={cx(
				'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
				variants[variant],
				sizes[size],
				className
			)}
			disabled={loading || props.disabled}
			{...props}
		>
			{loading && <Spinner className="size-3.5" />}
			{children}
		</button>
	);
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			className={cx(
				// 16px on mobile prevents iOS Safari auto-zoom on focus; 14px from sm+.
				'h-9 w-full rounded-lg border border-border bg-surface px-3 text-base text-fg placeholder:text-faint sm:text-sm',
				'outline-none transition focus:border-border-strong focus:ring-2 focus:ring-fg/10',
				className
			)}
			{...props}
		/>
	);
}

export function Checkbox({ indeterminate, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { indeterminate?: boolean }) {
	const ref = useRef<HTMLInputElement>(null);
	// `indeterminate` is a DOM property only - must be set imperatively.
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = !!indeterminate;
	}, [indeterminate]);
	return <input ref={ref} type="checkbox" className={cx('size-3.5 accent-[var(--color-accent)]', className)} {...props} />;
}

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'success' | 'danger' | 'accent' | 'warn' }) {
	const tones = {
		muted: 'bg-surface-2 text-muted border-border',
		success: 'bg-success/10 text-success border-success/25',
		danger: 'bg-danger/10 text-danger border-danger/25',
		warn: 'bg-warn/10 text-warn border-warn/30',
		accent: 'bg-fg/10 text-fg border-fg/20',
	};
	return (
		<span className={cx('inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium', tones[tone])}>
			{children}
		</span>
	);
}

/** The pill that slides between the selected item of a nav list or a segmented
 *  control. One implementation so every tab switch in the app moves the same way. */
export function SlidingIndicator({ layoutId, className }: { layoutId: string; className?: string }) {
	return (
		<motion.span
			layoutId={layoutId}
			className={cx('absolute inset-0 rounded-lg bg-surface-2 ring-1 ring-border', className)}
			transition={{ type: 'spring', stiffness: 380, damping: 32 }}
		/>
	);
}

/** Segmented control. The caller owns the value; options are label/value pairs. */
export function Segmented<T extends string>({
	value,
	options,
	onChange,
	layoutId,
}: {
	value: T;
	options: { value: T; label: string }[];
	onChange: (value: T) => void;
	layoutId: string;
}) {
	return (
		<div role="tablist" className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
			{options.map((option) => {
				const selected = option.value === value;
				return (
					<button
						key={option.value}
						role="tab"
						aria-selected={selected}
						onClick={() => onChange(option.value)}
						className={cx(
							'relative rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
							selected ? 'text-fg' : 'text-muted hover:text-fg'
						)}
					>
						{selected && <SlidingIndicator layoutId={layoutId} className="rounded-md" />}
						<span className="relative z-10">{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}

export function Spinner({ className }: { className?: string }) {
	return (
		<svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" width="16" height="16">
			<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
			<path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
		</svg>
	);
}

export function CopyButton({ value, className }: { value: string; className?: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
				navigator.clipboard.writeText(value).then(() => {
					setCopied(true);
					setTimeout(() => setCopied(false), 1400);
				});
			}}
			title="Copy"
			className={cx('grid size-7 place-items-center rounded-md text-faint transition hover:bg-surface-2 hover:text-fg', className)}
		>
			{copied ? <IconCheck className="size-4 text-success" /> : <IconCopy className="size-4" />}
		</button>
	);
}

/* --------------------------------------------------------------- skeletons --- */

/** A single resting block with one sweeping highlight. Width/height come from the caller. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
	return <div className={cx('skeleton', className)} style={style} />;
}

/** A stack of text lines, the last one deliberately short so it reads as prose. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
	return (
		<div className={cx('flex flex-col gap-2', className)}>
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton key={i} className={cx('h-3', i === lines - 1 ? 'w-2/5' : i % 2 ? 'w-4/5' : 'w-full')} />
			))}
		</div>
	);
}

/** Stat tiles matching the Overview grid. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{Array.from({ length: count }).map((_, i) => (
				<Card key={i} className="p-4">
					<Skeleton className="h-2.5 w-20" />
					<Skeleton className="mt-3 h-7 w-24" />
					<Skeleton className="mt-2 h-2.5 w-28" />
				</Card>
			))}
		</div>
	);
}

/** Rows of a list or table, with an optional leading avatar/among-columns hint. */
export function SkeletonRows({ rows = 6, leading = false, columns = 2 }: { rows?: number; leading?: boolean; columns?: number }) {
	return (
		<div>
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className={cx('flex items-center gap-3 px-4 py-3.5', i !== rows - 1 && 'rule-b')}>
					{leading && <Skeleton className="size-8 shrink-0 rounded-full" />}
					<div className="min-w-0 flex-1">
						<Skeleton className={cx('h-3', i % 3 === 0 ? 'w-40' : i % 3 === 1 ? 'w-56' : 'w-32')} />
						<Skeleton className="mt-2 h-2.5 w-24" />
					</div>
					{Array.from({ length: Math.max(0, columns - 1) }).map((_, c) => (
						<Skeleton key={c} className="hidden h-3 w-16 sm:block" />
					))}
					<Skeleton className="h-7 w-7 rounded-md" />
				</div>
			))}
		</div>
	);
}

/** A card with a title line and a chart-shaped body. */
export function SkeletonChart({ className }: { className?: string }) {
	// Fixed silhouette: a deterministic wave reads as data, random bars read as noise.
	const bars = [38, 52, 44, 66, 58, 74, 62, 80, 70, 88, 76, 92, 84, 68, 56];
	return (
		<Card className={cx('p-4 sm:p-5', className)}>
			<Skeleton className="h-3 w-36" />
			<div className="mt-5 flex h-48 items-end gap-1.5" aria-hidden="true">
				{bars.map((h, i) => (
					<Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
				))}
			</div>
		</Card>
	);
}

export function Skeletons({ children, label = 'Loading' }: { children: ReactNode; label?: string }) {
	return (
		<div className="animate-in" role="status" aria-busy="true" aria-live="polite">
			<span className="sr-only">{label}</span>
			{children}
		</div>
	);
}

/* ----------------------------------------------------------------- dialogs --- */

export function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel = 'Confirm',
	tone = 'danger',
	loading,
	onConfirm,
	onCancel,
}: {
	open: boolean;
	title: string;
	message: ReactNode;
	confirmLabel?: string;
	tone?: 'danger' | 'primary';
	loading?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	return (
		<Modal open={open} onClose={onCancel} dismissable={!loading} className="max-w-sm">
			<Card className="p-5 shadow-2xl">
				<h2 className="text-base font-semibold text-fg">{title}</h2>
				<div className="mt-1.5 text-[13px] leading-relaxed text-muted">{message}</div>
				<div className="mt-5 flex justify-end gap-2">
					<Button onClick={onCancel} disabled={loading}>
						Cancel
					</Button>
					<Button variant={tone} loading={loading} onClick={onConfirm} autoFocus>
						{confirmLabel}
					</Button>
				</div>
			</Card>
		</Modal>
	);
}

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
	return (
		<div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
			{icon && <div className="dashed-box mb-1 grid size-11 place-items-center rounded-xl border-border-strong text-faint">{icon}</div>}
			<p className="text-sm font-medium text-fg">{title}</p>
			{hint && <p className="max-w-xs text-[13px] text-muted">{hint}</p>}
		</div>
	);
}
