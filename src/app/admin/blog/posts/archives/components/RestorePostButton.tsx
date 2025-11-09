// src/app/admin/blog/posts/archives/components/RestorePostButton.tsx
'use client';

import { useTransition } from 'react';
import { RotateCcw } from 'lucide-react';

export default function RestorePostButton({ id, slug }: { id: string; slug: string }) {
    const [pending, start] = useTransition();

    return (
        <button
            disabled={pending}
            onClick={() =>
                start(async () => {
                    const r = await fetch('/api/admin/blog/posts/archives', {
                        method: 'PATCH',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ action: 'restore', id, slug }),
                    });
                    const data = await r.json().catch(() => ({}));
                    if (!r.ok || !data?.ok) {
                        alert(data?.error || `HTTP ${r.status}`);
                        return;
                    }
                    // Slug possiblement modifié lors de la restauration
                    location.href = `/admin/blog/posts/${data.slug}`;
                })
            }
            className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-50 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
        >
            <RotateCcw className="h-4 w-4" />
            {pending ? 'Restauration…' : 'Restaurer'}
        </button>
    );
}
