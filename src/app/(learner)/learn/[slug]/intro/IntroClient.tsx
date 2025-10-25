// src/app/(learner)/learn/[slug]/intro/IntroClient.tsx
'use client';

import { useState } from 'react';

export default function IntroClient({ slug }: { slug: string }) {
    const [agree, setAgree] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [captions, setCaptions] = useState(true);

    async function onStart() {
        try {
            setBusy(true);
            setErr(null);
            // Initialise currentDay à 1
            const r = await fetch('/api/learn/progress', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, action: 'setDay', day: 1 }),
            });
            if (!r.ok) throw new Error('Impossible de démarrer');
            // mémorise la préférence captions côté client (optionnel)
            if (typeof window !== 'undefined') localStorage.setItem(`captions:${slug}`, captions ? 'on' : 'off');
            window.location.href = `/learn/${slug}/day/1`;
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur">
            <div className="space-y-4 text-sm">
                <label className="flex items-center gap-2 text-foreground">
                    <input type="checkbox" checked={captions} onChange={(e) => setCaptions(e.target.checked)} />
                    Activer les sous-titres par défaut (recommandé)
                </label>

                <label className="flex items-start gap-2 text-foreground">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                    <span>Je m’engage à pratiquer en douceur, à m’hydrater et à m’arrêter si je me sens dépassé(e).</span>
                </label>
            </div>

            <div className="mt-5 flex items-center gap-3">
                <button
                    onClick={onStart}
                    disabled={!agree || busy}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
                >
                    {busy ? 'Démarrage…' : 'Commencer'}
                </button>
                {err && <span className="text-sm text-brand-700">{err}</span>}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">Tu pourras toujours mettre en pause pendant une leçon. On garde tes notes automatiquement.</p>
        </div>
    );
}
