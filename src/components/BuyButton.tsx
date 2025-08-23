'use client';
import { useState } from 'react';

export default function BuyButton({ slug, isFree }: { slug: string; isFree: boolean }) {
    const [pending, setPending] = useState(false);

    async function click() {
        setPending(true);
        const r = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ slug }),
        });
        const d = await r.json().catch(() => ({}));
        setPending(false);

        if (r.status === 401) {
            const next = encodeURIComponent(`/programs/${slug}`);
            location.href = `/login?next=${next}`;
            return;
        }
        if (!r.ok) {
            alert(d?.error || 'Action impossible.');
            return;
        }
        if (d.redirectTo) {
            location.href = d.redirectTo; // gratuit : go jour 1
            return;
        }
        if (d.url) {
            location.href = d.url; // Stripe Checkout
            return;
        }
    }

    return (
        <button className="rounded-lg bg-brand px-4 py-2 text-white disabled:opacity-50" onClick={click} disabled={pending}>
            {pending ? (isFree ? 'Ouverture…' : 'Redirection…') : isFree ? 'Commencer' : 'Acheter'}
        </button>
    );
}
