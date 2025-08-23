// src/components/BuyButton.tsx
'use client';

import { useState } from 'react';

type StartOkRedirect = { ok: true; redirectTo: string; enrollmentId?: string; devBypass?: boolean };
type StartOkStripe = { url: string };
type StartAuth = { error: string; redirectTo: string }; // 401 non authentifié

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}
function hasString(o: Record<string, unknown>, k: string): o is Record<string, string> {
    return typeof o[k] === 'string';
}
function isStartAuth(x: unknown): x is StartAuth {
    return isRecord(x) && hasString(x, 'error') && hasString(x, 'redirectTo');
}
function isStartOkRedirect(x: unknown): x is StartOkRedirect {
    return isRecord(x) && (x as Record<string, unknown>).ok === true && hasString(x, 'redirectTo');
}
function isStartOkStripe(x: unknown): x is StartOkStripe {
    return isRecord(x) && hasString(x, 'url');
}
function extractError(x: unknown): string | null {
    return isRecord(x) && typeof x.error === 'string' ? x.error : null;
}

export default function BuyButton({ slug, isFree }: { slug: string; isFree: boolean }) {
    const [pending, setPending] = useState(false);

    async function click() {
        setPending(true);
        const r = await fetch('/api/checkout/start', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ slug }),
        });
        const data: unknown = await r.json().catch(() => ({}));
        setPending(false);

        if (r.status === 401) {
            if (isStartAuth(data)) {
                location.href = data.redirectTo; // e.g. /login?next=...
            } else {
                const next = encodeURIComponent(`/programs/${slug}#commencer`);
                location.href = `/login?next=${next}`;
            }
            return;
        }

        if (!r.ok) {
            alert(extractError(data) || 'Action impossible.');
            return;
        }

        if (isStartOkRedirect(data)) {
            location.href = data.redirectTo; // gratuit / déjà inscrit / bypass
            return;
        }

        if (isStartOkStripe(data)) {
            location.href = data.url; // Stripe Checkout
            return;
        }

        alert('Réponse inattendue.');
    }

    return (
        <button className="rounded-lg bg-brand px-4 py-2 text-white disabled:opacity-50" onClick={click} disabled={pending} aria-busy={pending}>
            {pending ? (isFree ? 'Ouverture…' : 'Redirection…') : isFree ? 'Commencer' : 'Acheter'}
        </button>
    );
}
