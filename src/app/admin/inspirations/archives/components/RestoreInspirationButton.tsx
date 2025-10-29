// src/app/admin/inspirations/archives/components/RestoreInspirationButton.tsx
'use client';

import { useTransition } from 'react';
import { RotateCcw } from 'lucide-react';

export default function RestoreInspirationButton({ slug }: { slug: string }) {
    const [pending, start] = useTransition();

    return (
        <button
            disabled={pending}
            onClick={() =>
                start(async () => {
                    const r = await fetch(`/api/admin/inspirations?slug=${encodeURIComponent(slug)}&action=restore`, { method: 'PATCH' });
                    const data = await r.json();
                    if (!r.ok || !data?.ok) {
                        alert(data?.error || `HTTP ${r.status}`);
                        return;
                    }
                    // redirection vers le slug restauré (potentiellement modifié)
                    location.href = `/admin/inspirations/${data.slug}`;
                })
            }
            className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-50 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
        >
            <RotateCcw className="h-4 w-4" />
            {pending ? 'Restauration…' : 'Restaurer'}
        </button>
    );
}
