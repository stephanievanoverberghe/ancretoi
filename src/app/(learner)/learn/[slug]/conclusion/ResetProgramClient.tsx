// src/app/(learner)/learn/[slug]/conclusion/ResetProgramClient.tsx
'use client';

import { useEffect, useRef, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import FullscreenModal from '@/components/ui/FullscreenModal';
import { X } from 'lucide-react';

function humanizeSlug(s: string) {
    return s
        .split('-')
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
}

export default function ResetProgramClient({
    slug,
    programTitle,
}: {
    slug: string;
    /** Titre lisible ; si absent, on humanise le slug */
    programTitle?: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [step2, setStep2] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [val, setVal] = useState('');
    const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

    const canConfirm = val.trim().toUpperCase() === 'RECOMMENCER';
    const name = (programTitle || humanizeSlug(slug)).trim();

    useEffect(() => {
        if (open) setTimeout(() => confirmBtnRef.current?.focus(), 0);
    }, [open]);

    async function onConfirm() {
        try {
            setBusy(true);
            setErr(null);

            // Wipe complet — ce slug uniquement
            await fetch(`/api/learn/state?slug=${encodeURIComponent(slug)}&all=1`, { method: 'DELETE' });

            // Remise J1 — ce slug uniquement
            await fetch('/api/learn/progress', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, action: 'setDay', day: 1 }),
            });

            // Redirection douce
            startTransition(() => {
                router.replace(`/learn/${slug}/intro`);
                router.refresh();
            });

            // Reset local
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
                            onClick={() => (!step2 ? setStep2(true) : canConfirm && onConfirm())}
                            disabled={busy || (step2 && !canConfirm)}
                            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                            {!step2 ? 'Oui, réinitialiser' : busy ? 'Suppression…' : 'Confirmer'}
                        </button>
                    </div>
                }
            >
                {/* Bouton X */}
                <button onClick={handleCancel} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition" aria-label="Fermer la modale">
                    <X className="h-5 w-5" />
                </button>

                {/* Bandeau d’info : formation ciblée */}

                <div className="mt-3 space-y-3">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                        <div className="font-medium text-foreground">Tu es sur le point de réinitialiser « {name} ».</div>
                        <div className="text-muted-foreground">Toutes tes réponses et états (pratique, terminé) pour cette formation seront supprimés.</div>
                    </div>

                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        <li>Suppression définitive des notes/réponses</li>
                        <li>Réinitialisation des indicateurs</li>
                    </ul>

                    <p className="text-sm text-muted-foreground">
                        Après suppression, ta progression sera remise au <span className="text-foreground">Jour 1</span> et tu seras redirigé vers l’
                        <span className="text-foreground">Introduction</span>.
                    </p>

                    {step2 && (
                        <div className="rounded-xl border border-border bg-muted/40 p-3">
                            <p className="text-sm text-muted-foreground">
                                Tape <span className="rounded px-1.5 py-0.5 text-foreground ring-1 ring-border">RECOMMENCER</span> pour confirmer la remise à zéro de « {name} ».
                            </p>
                            <div className="mt-3">
                                <input
                                    value={val}
                                    onChange={(e) => setVal(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-brand-600/40"
                                    placeholder="Écris RECOMMENCER pour confirmer"
                                    disabled={busy}
                                    aria-label={`Confirmer la réinitialisation de ${name}`}
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
