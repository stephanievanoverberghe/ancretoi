'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SuccessPage() {
    const sp = useSearchParams();
    const router = useRouter();
    const session_id = sp.get('session_id');
    const program = sp.get('program');
    const [msg, setMsg] = useState('Validation du paiement…');

    useEffect(() => {
        (async () => {
            if (!session_id || !program) return;
            const r = await fetch('/api/checkout/confirm', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ session_id, program }),
            });
            const d = await r.json().catch(() => ({}));
            if (r.ok && d.redirectTo) {
                router.replace(d.redirectTo);
            } else {
                setMsg(d?.error || 'Impossible de confirmer le paiement.');
            }
        })();
    }, [session_id, program, router]);

    return (
        <div className="mx-auto max-w-md p-6">
            <h1 className="mb-2 font-serif text-3xl">Merci 🙏</h1>
            <p className="text-sm text-muted-foreground">{msg}</p>
        </div>
    );
}
