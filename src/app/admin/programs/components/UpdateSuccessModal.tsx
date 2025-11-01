// src/app/admin/programs/components/UpdateSuccessModal.tsx

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';

export default function UpdateSuccessModal() {
    const search = useSearchParams();
    const router = useRouter();

    const show = search.get('updated') === '1';
    const slug = (search.get('slug') ?? '').trim().toLowerCase();

    const [open, setOpen] = useState(show);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setOpen(show), [show]);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open || !mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open, mounted]);

    if (!open || !mounted) return null;

    const onClose = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('updated');
        url.searchParams.delete('slug');
        router.replace(url.pathname + (url.search || '')); // nettoie l'URL
        setOpen(false);
        router.push('/admin/programs');
    };

    return createPortal(
        <div className="fixed inset-0 z-[1100]">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-brand-100/70">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden />
                        <div>
                            <div className="text-lg font-semibold">Modifications enregistrées</div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Le programme <span className="font-medium">{slug || '—'}</span> a été mis à jour avec succès.
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                        <button onClick={onClose} className="rounded-md bg-purple-600 px-3 py-2 text-white hover:bg-purple-700">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
