// src/app/(learner)/learn/[slug]/conclusion/ResetProgramClient.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import FullscreenModal from '@/components/ui/FullscreenModal';

export default function ResetProgramClient({ slug }: { slug: string }) {
    const [open, setOpen] = useState(false);
    const [step2, setStep2] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
        if (open) setTimeout(() => confirmBtnRef.current?.focus(), 0);
    }, [open]);

    async function onConfirm() {
        try {
            setBusy(true);
            setErr(null);

            // wipe complet (nécessite all=1 côté DELETE /api/learn/state)
            await fetch(`/api/learn/state?slug=${encodeURIComponent(slug)}&all=1`, { method: 'DELETE' });

            // remise au jour 1
            await fetch('/api/learn/progress', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, action: 'setDay', day: 1 }),
            });

            // redirection vers l’intro
            window.location.href = `/learn/${slug}/intro`;
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue');
            setOpen(false);
            setStep2(false);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <button onClick={() => setOpen(true)} className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                Réinitialiser le programme
            </button>

            <FullscreenModal
                open={open}
                onClose={() => {
                    if (!busy) {
                        setOpen(false);
                        setStep2(false);
                    }
                }}
                title="Recommencer depuis le début ?"
                footer={
                    <>
                        <button
                            ref={confirmBtnRef}
                            onClick={() => setStep2(true)}
                            disabled={busy}
                            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                            {step2 ? 'Confirmer' : 'Oui, réinitialiser'}
                        </button>
                    </>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Cette action est <span className="font-medium text-foreground">définitive</span>. Elle supprime l’ensemble des données de ce programme :
                    </p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        <li>toutes tes notes et réponses</li>
                        <li>toutes les valeurs de curseurs</li>
                        <li>tous les états (pratique, mantra, terminé)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground">
                        Après suppression, ta progression sera remise au <span className="text-foreground">Jour 1</span> et tu seras redirigé·e vers l’
                        <span className="text-foreground">Introduction</span>.
                    </p>

                    {step2 && (
                        <ConfirmAll
                            onConfirm={onConfirm}
                            onCancel={() => {
                                if (!busy) {
                                    setOpen(false);
                                    setStep2(false);
                                }
                            }}
                            busy={busy}
                        />
                    )}

                    {err && <div className="rounded-lg border border-border bg-muted/40 p-2 text-sm text-brand-700">{err}</div>}
                </div>
            </FullscreenModal>
        </>
    );
}

function ConfirmAll({ onConfirm, onCancel, busy }: { onConfirm: () => void; onCancel: () => void; busy: boolean }) {
    const [val, setVal] = useState('');
    const can = val.trim().toUpperCase() === 'RECOMMENCER';
    return (
        <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-sm text-muted-foreground">
                Tape <span className="rounded px-1.5 py-0.5 text-foreground ring-1 ring-border">RECOMMENCER</span> ci-dessous pour confirmer.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-brand-600/40"
                    placeholder="Écris RECOMMENCER pour confirmer"
                    disabled={busy}
                />
                <div className="flex gap-2">
                    <button disabled={!can || busy} onClick={onConfirm} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                        Supprimer toutes les données
                    </button>
                    <button onClick={onCancel} disabled={busy} className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
}
