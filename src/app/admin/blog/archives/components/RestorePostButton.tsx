// src/app/admin/blog/archives/components/RestorePostButton.tsx
'use client';

import { useTransition } from 'react';
import { RotateCcw } from 'lucide-react';

export default function RestorePostButton({ slug }: { slug: string }) {
    const [pending, start] = useTransition();

    return (
        <button
            disabled={pending}
            onClick={() =>
                start(async () => {
                    // ⚠️ Nécessite un endpoint PATCH /api/admin/blog?slug=...&action=restore
                    const r = await fetch(`/api/admin/blog?slug=${encodeURIComponent(slug)}&action=restore`, { method: 'PATCH' });
                    const data = await r.json().catch(() => ({}));
                    if (!r.ok || !data?.ok) {
                        alert(data?.error || `HTTP ${r.status}`);
                        return;
                    }
                    // Redirige vers l’édition après restauration (slug possiblement modifié)
                    location.href = `/admin/blog/${data.slug}`;
                })
            }
            className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-50 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
        >
            <RotateCcw className="h-4 w-4" />
            {pending ? 'Restauration…' : 'Restaurer'}
        </button>
    );
}
