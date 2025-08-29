'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UpdateSuccessModal() {
    const search = useSearchParams();
    const router = useRouter();
    const showParam = search.get('updated') === '1';
    const [open, setOpen] = useState(showParam);

    useEffect(() => setOpen(showParam), [showParam]);

    if (!open) return null;

    const onClose = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete('updated');
        router.replace(url.pathname + (url.search || ''));
        setOpen(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
                <div className="text-lg font-semibold">Mise à jour effectuée ✅</div>
                <p className="mt-2 text-sm text-muted-foreground">Les modifications ont bien été enregistrées.</p>
                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
