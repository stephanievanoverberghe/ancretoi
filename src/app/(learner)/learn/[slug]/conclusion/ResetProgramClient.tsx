'use client';

import { useEffect, useRef, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import FullscreenModal from '@/components/ui/FullscreenModal';
import { X } from 'lucide-react';

export default function ResetProgramClient({ slug }: { slug: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [step2, setStep2] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [val, setVal] = useState('');

    const canConfirm = val.trim().toUpperCase() === 'RECOMMENCER';
    const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (open) setTimeout(() => confirmBtnRef.current?.focus(), 0);
    }, [open]);

    async function onConfirm() {
        try {
            setBusy(true);
            setErr(null);

            // wipe complet (DELETE all DayState pour ce slug)
            await fetch(`/api/learn/state?slug=${encodeURIComponent(slug)}&all=1`, { method: 'DELETE' });

            // retour focus J1
            await fetch('/api/learn/progress', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, action: 'setDay', day: 1 }),
            });

            // redirection douce
            startTransition(() => {
                router.replace(`/learn/${slug}/intro`);
                router.refresh();
            });

            // reset modale
            setOpen(false);
            setStep2(false);
            setVal('');
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setBusy(false);
        }
    }

    function handleCancel() {
        if (busy) return;
        setOpen(false);
        setStep2(false);
        setVal('');
        setErr(null);
    }

    return (
        <>
            <button onClick={() => setOpen(true)} className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                Réinitialiser le programme
            </button>

            <FullscreenModal
                open={open}
                onClose={handleCancel}
                title="Recommencer depuis le début ?"
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleCancel}
                            disabled={busy}
                            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                        >
                            Annuler
                        </button>

                        <button
                            ref={confirmBtnRef}
                            onClick={() => {
                                if (!step2) setStep2(true);
                                else if (canConfirm) onConfirm();
                            }}
                            disabled={busy || (step2 && !canConfirm)}
                            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                            {!step2 ? 'Oui, réinitialiser' : busy ? 'Suppression…' : 'Confirmer'}
                        </button>
                    </div>
                }
            >
                {/* ❌ Croix pour fermer */}
                <button onClick={handleCancel} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition" aria-label="Fermer la modale">
                    <X className="h-5 w-5" />
                </button>

                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Cette action est <span className="font-medium text-foreground">définitive</span> et supprime toutes les données de ce programme :
                    </p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        <li>tes notes et réponses</li>
                        <li>tous les états (pratique, terminé)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground">
                        Après suppression, ta progression sera remise au <span className="text-foreground">Jour 1</span> et tu seras redirigé·e vers l’
                        <span className="text-foreground">Introduction</span>.
                    </p>

                    {step2 && (
                        <div className="rounded-xl border border-border bg-muted/40 p-3">
                            <p className="text-sm text-muted-foreground">
                                Tape <span className="rounded px-1.5 py-0.5 text-foreground ring-1 ring-border">RECOMMENCER</span> ci-dessous pour confirmer.
                            </p>
                            <div className="mt-3">
                                <input
                                    value={val}
                                    onChange={(e) => setVal(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-brand-600/40"
                                    placeholder="Écris RECOMMENCER pour confirmer"
                                    disabled={busy}
                                />
                            </div>
                        </div>
                    )}

                    {err && <div className="rounded-lg border border-border bg-muted/40 p-2 text-sm text-brand-700">{err}</div>}
                </div>
            </FullscreenModal>
        </>
    );
}
