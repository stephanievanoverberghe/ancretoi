'use client';

import { useState } from 'react';
import FullscreenModal from '@/components/ui/FullscreenModal';

export default function DangerZoneClient({ email }: { email: string }) {
    const [open, setOpen] = useState(false);
    const [val, setVal] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function onDelete() {
        if (val.trim() !== 'SUPPRIMER') return;
        setBusy(true);
        setErr(null);
        try {
            const r = await fetch('/api/settings/delete-account', { method: 'POST' });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j?.ok) throw new Error(j?.error || 'Impossible de supprimer le compte');
            window.location.href = '/goodbye';
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
            <h3 className="text-base font-semibold text-rose-800">Zone à risque</h3>
            <p className="mt-1 text-sm text-rose-700">Cette action est définitive. Tu peux demander la suppression de ton compte ({email}).</p>
            <div className="mt-3">
                <button onClick={() => setOpen(true)} className="rounded-lg border border-rose-300 bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-200">
                    Supprimer mon compte
                </button>
            </div>

            <FullscreenModal
                open={open}
                onClose={() => {
                    if (!busy) setOpen(false);
                }}
                title="Supprimer définitivement le compte ?"
                footer={null}
                zIndex={1200}
            >
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Tape <span className="rounded px-1 py-0.5 ring-1 ring-border text-foreground">SUPPRIMER</span> ci-dessous pour confirmer.
                    </p>
                    <input
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand-600/40"
                        placeholder="SUPPRIMER"
                        disabled={busy}
                    />
                    {err && <div className="text-sm text-brand-700">{err}</div>}
                    <div className="mt-2 flex justify-end gap-2">
                        <button onClick={() => setOpen(false)} disabled={busy} className="rounded-lg px-3 py-2 text-sm ring-1 ring-border hover:bg-muted">
                            Annuler
                        </button>
                        <button
                            onClick={onDelete}
                            disabled={val.trim() !== 'SUPPRIMER' || busy}
                            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 hover:bg-rose-700"
                        >
                            {busy ? 'Suppression…' : 'Confirmer la suppression'}
                        </button>
                    </div>
                </div>
            </FullscreenModal>
        </section>
    );
}
