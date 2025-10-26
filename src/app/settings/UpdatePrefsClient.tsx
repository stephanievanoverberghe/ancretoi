'use client';

import { useState, useTransition } from 'react';

type Prefs = {
    theme: 'system' | 'light' | 'dark';
    marketing: boolean;
    productUpdates: boolean;
};

export default function UpdatePrefsClient({ initial }: { initial: Prefs }) {
    const [prefs, setPrefs] = useState<Prefs>(initial);
    const [ok, setOk] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [pending, start] = useTransition();

    function set<K extends keyof Prefs>(k: K, v: Prefs[K]) {
        setOk(null);
        setErr(null);
        setPrefs((p) => ({ ...p, [k]: v }));
    }

    const Seg = ({ v, label }: { v: Prefs['theme']; label: string }) => (
        <button
            type="button"
            onClick={() => set('theme', v)}
            className={['flex-1 rounded-lg px-3 py-2 text-sm ring-1 transition', prefs.theme === v ? 'bg-brand-600 text-white ring-brand-600' : 'ring-border hover:bg-muted'].join(
                ' '
            )}
            aria-pressed={prefs.theme === v}
        >
            {label}
        </button>
    );

    async function save() {
        setOk(null);
        setErr(null);
        start(async () => {
            const r = await fetch('/api/settings/prefs', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(prefs),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j?.ok) setErr(j?.error || 'Erreur inconnue');
            else setOk('Préférences enregistrées ✅');
        });
    }

    return (
        <div className="space-y-5">
            {/* Thème (segmented) */}
            <div>
                <div className="mb-2 text-sm font-medium">Thème</div>
                <div className="grid grid-cols-3 gap-2">
                    <Seg v="system" label="Système" />
                    <Seg v="light" label="Clair" />
                    <Seg v="dark" label="Sombre" />
                </div>
            </div>

            {/* Emails */}
            <div>
                <div className="mb-2 text-sm font-medium">Notifications e-mail</div>
                <div className="grid gap-2 sm:grid-cols-2">
                    <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        <span>Conseils & offres (occasionnels)</span>
                        <input type="checkbox" checked={prefs.marketing} onChange={(e) => set('marketing', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
                        <span>Actualités produit & nouveautés</span>
                        <input type="checkbox" checked={prefs.productUpdates} onChange={(e) => set('productUpdates', e.target.checked)} />
                    </label>
                </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={save}
                    disabled={pending}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
                >
                    {pending ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                {ok && <span className="text-xs text-emerald-700">{ok}</span>}
                {err && <span className="text-xs text-brand-700">{err}</span>}
            </div>
        </div>
    );
}
