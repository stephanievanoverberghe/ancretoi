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
    zIndex?: number; // optionnel
};

export default function FullscreenModal({ open, onClose, title, children, footer, zIndex = 1000 }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // lock scroll quand la modale est ouverte
    useEffect(() => {
        if (!open || !mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open, mounted]);

    if (!open || !mounted) return null;

    const node = (
        <div role="dialog" aria-modal="true" className="fixed inset-0" style={{ zIndex }}>
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} aria-hidden />
            {/* conteneur centré */}
            <div className="relative z-10 flex min-h-full items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-xl">
                    {title && <h3 className="text-lg font-semibold">{title}</h3>}
                    <div className="mt-3">{children}</div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                        {footer}
                        <button onClick={onClose} className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(node, document.body);
}
