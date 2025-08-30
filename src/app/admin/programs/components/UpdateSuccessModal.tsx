// src/app/admin/programs/components/UpdateSuccessModal.tsx

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function UpdateSuccessModal() {
    const search = useSearchParams();
    const router = useRouter();

    const show = search.get('updated') === '1';
    const [open, setOpen] = useState(show);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setOpen(show), [show]);
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

    if (!open || !mounted) return null;

    const onClose = () => {
        router.push('/admin/programs'); // 👉 redirection vers la liste
    };

    return createPortal(
        <div className="fixed inset-0 z-[1100]">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-brand-100/70">
                    <div className="text-lg font-semibold">Mise à jour effectuée ✅</div>
                    <p className="mt-2 text-sm text-muted-foreground">Les modifications ont bien été enregistrées.</p>
                    <div className="mt-4 flex justify-end">
                        <button onClick={onClose} className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
                            Retour au listing
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
