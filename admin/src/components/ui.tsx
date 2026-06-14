import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { IconCopy, IconCheck } from './icons';
import { Modal } from './Modal';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export function Card({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={cx('rounded-[--radius] border border-border bg-surface', className)}>{children}</div>;
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
		default: 'bg-surface-2 hover:bg-elevated border border-border text-fg',
		primary: 'bg-accent hover:opacity-90 text-accent-fg border border-transparent',
		ghost: 'hover:bg-surface-2 text-muted hover:text-fg border border-transparent',
		danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20',
	};
	const sizes = { sm: 'h-8 px-3 text-[13px]', md: 'h-9 px-4 text-sm' };
	return (
		<button
			className={cx(
				'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
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
				'h-9 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg placeholder:text-faint',
				'outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20',
				className
			)}
			{...props}
		/>
	);
}

export function Checkbox({ indeterminate, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { indeterminate?: boolean }) {
	const ref = useRef<HTMLInputElement>(null);
	// `indeterminate` is a DOM property only — must be set imperatively.
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = !!indeterminate;
	}, [indeterminate]);
	return <input ref={ref} type="checkbox" className={cx('size-3.5 accent-[var(--color-accent)]', className)} {...props} />;
}

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'success' | 'danger' | 'accent' | 'warn' }) {
	const tones = {
		muted: 'bg-surface-2 text-muted border-border',
		success: 'bg-success/10 text-success border-success/20',
		danger: 'bg-danger/10 text-danger border-danger/20',
		warn: 'bg-warn/10 text-warn border-warn/25',
		accent: 'bg-accent/12 text-accent border-accent/25',
	};
	return (
		<span className={cx('inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium', tones[tone])}>
			{children}
		</span>
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

export function Skeleton({ className }: { className?: string }) {
	return <div className={cx('animate-pulse rounded-md bg-surface-2', className)} />;
}

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
			{icon && <div className="mb-1 grid size-11 place-items-center rounded-xl border border-border bg-surface-2 text-faint">{icon}</div>}
			<p className="text-sm font-medium text-fg">{title}</p>
			{hint && <p className="max-w-xs text-[13px] text-muted">{hint}</p>}
		</div>
	);
}
