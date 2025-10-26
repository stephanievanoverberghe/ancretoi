// src/components/ui/FullscreenModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    zIndex?: number;
    closeOnBackdrop?: boolean; // NEW (default true)
    closeOnEsc?: boolean; // NEW (default true)
};

export default function FullscreenModal({ open, onClose, title, children, footer, zIndex = 1000, closeOnBackdrop = true, closeOnEsc = true }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // lock scroll
    useEffect(() => {
        if (!open || !mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open, mounted]);

    // ESC to close
    useEffect(() => {
        if (!open || !closeOnEsc) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, closeOnEsc, onClose]);

    if (!open || !mounted) return null;

    const node = (
        <div role="dialog" aria-modal="true" className="fixed inset-0" style={{ zIndex }}>
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeOnBackdrop ? onClose : undefined} aria-hidden />
            {/* container */}
            <div className="relative z-10 flex min-h-full items-center justify-center p-4 sm:p-6">
                <div className="relative w-full max-w-2xl rounded-2xl border bg-white p-6 shadow-xl">
                    {title && <h3 className="text-lg font-semibold">{title}</h3>}
                    <div className="mt-3">{children}</div>
                    {footer && <div className="mt-4 flex items-center justify-end gap-2">{footer}</div>}
                </div>
            </div>
        </div>
    );

    return createPortal(node, document.body);
}
