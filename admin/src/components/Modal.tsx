import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Portal-rendered modal. Mounted on <body> so the backdrop always covers the full
 * viewport and the panel sits dead-center regardless of ancestor transforms/padding.
 * Animated enter/exit with motion (backdrop fade + panel spring).
 */
export function Modal({
	open,
	onClose,
	children,
	className,
	dismissable = true,
}: {
	open: boolean;
	onClose: () => void;
	children: ReactNode;
	className?: string;
	dismissable?: boolean;
}) {
	// Esc to close + lock body scroll while open.
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismissable && onClose();
		window.addEventListener('keydown', onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			window.removeEventListener('keydown', onKey);
			document.body.style.overflow = prev;
		};
	}, [open, onClose, dismissable]);

	return createPortal(
		<AnimatePresence>
			{open && (
				<motion.div
					className="fixed inset-0 z-50 grid place-items-center p-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.18, ease: 'easeOut' }}
				>
					<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismissable ? onClose : undefined} />
					<motion.div
						className={`relative w-full ${className ?? ''}`}
						initial={{ opacity: 0, scale: 0.95, y: 12 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.97, y: 8 }}
						transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.7 }}
					>
						{children}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body
	);
}
