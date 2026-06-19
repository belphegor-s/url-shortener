import * as Flags from 'country-flag-icons/react/3x2';
import { cx } from './ui';

/** SVG country flag from `country-flag-icons`. Falls back to a neutral globe for unknown codes. */
export function Flag({ code, className }: { code: string | null; className?: string }) {
	const cc = code?.toUpperCase();
	const Svg = cc && cc.length === 2 ? (Flags as Record<string, React.ComponentType<{ title?: string; className?: string }>>)[cc] : undefined;
	const cls = cx('inline-block w-[1.35em] shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10', className);
	if (!Svg) {
		return (
			<span className={cx(cls, 'grid aspect-[3/2] place-items-center bg-surface-2 text-faint')} aria-label="Unknown country">
				<svg viewBox="0 0 24 24" fill="none" className="size-[0.7em]" aria-hidden>
					<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
					<path d="M3 12h18M12 3c2.5 2.5 2.5 16 0 18M12 3c-2.5 2.5-2.5 16 0 18" stroke="currentColor" strokeWidth="1.5" />
				</svg>
			</span>
		);
	}
	return <Svg className={cls} title={cc} />;
}
