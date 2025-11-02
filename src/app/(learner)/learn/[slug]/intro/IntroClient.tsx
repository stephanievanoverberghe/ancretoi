'use client';

import { useEffect, useRef, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FullscreenModal from '@/components/ui/FullscreenModal';
import { X } from 'lucide-react';

export default function IntroClient({ slug, initialEngaged, hasProgress, learnerName }: { slug: string; initialEngaged: boolean; hasProgress: boolean; learnerName: string }) {
    const router = useRouter();
    const [engaged, setEngaged] = useState(initialEngaged);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // ——— Modal désengagement
    const [open, setOpen] = useState(false);
    const [step2, setStep2] = useState(false);
    const [modalBusy, setModalBusy] = useState(false);
    const [modalErr, setModalErr] = useState<string | null>(null);
    const [val, setVal] = useState('');
    const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => setEngaged(initialEngaged), [initialEngaged]);
    useEffect(() => {
        if (open) setTimeout(() => confirmBtnRef.current?.focus(), 0);
    }, [open]);

    async function performEngage(next: boolean) {
        const r = await fetch('/api/learn/intro', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ slug, engaged: next }),
            cache: 'no-store',
        });
        if (!r.ok) {
            const j = (await r.json().catch(() => ({}))) as { error?: string };
            throw new Error(j?.error || 'Impossible de sauvegarder ton engagement');
        }
    }

    async function wipeAllProgress() {
        await fetch(`/api/learn/state?slug=${encodeURIComponent(slug)}&all=1`, { method: 'DELETE' });
        await fetch('/api/learn/progress', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ slug, action: 'setDay', day: 1 }),
        });
    }

    async function toggleEngaged(next: boolean) {
        try {
            setErr(null);

            if (next) {
                setBusy(true);
                setEngaged(true);
                await performEngage(true);
                startTransition(() => router.refresh());
                return;
            }

            if (hasProgress) {
                setOpen(true);
                return;
            }

            // Pas de progression → désengagement simple
            setBusy(true);
            await wipeAllProgress();
            await performEngage(false);
            setEngaged(false);
            startTransition(() => router.replace(`/learn/${slug}/intro`));
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue');
            if (next) setEngaged(false);
        } finally {
            setBusy(false);
        }
    }

    async function onConfirmDisengage() {
        try {
            setModalBusy(true);
            setModalErr(null);
            await wipeAllProgress();
            await performEngage(false);

            setEngaged(false);
            setOpen(false);
            setStep2(false);
            setVal('');
            startTransition(() => router.replace(`/learn/${slug}/intro`));
        } catch (e) {
            setModalErr(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setModalBusy(false);
        }
    }

    async function onStart() {
        try {
            setBusy(true);
            setErr(null);
            const r = await fetch('/api/learn/progress', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, action: 'setDay', day: 1 }),
            });
            if (!r.ok) throw new Error('Impossible de démarrer');
            window.location.href = `/learn/${slug}/day/1`;
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setBusy(false);
        }
    }

    const canConfirm = val.trim().toUpperCase() === 'DESENGAGER';
    const showStartedBanner = engaged && hasProgress;

    return (
        <>
            <section id="engagement" className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-foreground">{learnerName ? `${learnerName}, ` : ''}on commence en conscience</h2>
                    <p className="text-sm text-muted-foreground">Coche l’engagement, puis démarre la première leçon quand tu es prête.</p>
                </div>

                <div className="mt-4">
                    <div className="rounded-xl border border-border/70 bg-white/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground">Engagement bien-être</div>
                                <p className="mt-0.5 text-sm text-muted-foreground">Je pratique en douceur, je m’hydrate et je m’arrête si je me sens dépassé(e).</p>
                            </div>

                            <button
                                type="button"
                                aria-pressed={engaged}
                                onClick={() => toggleEngaged(!engaged)}
                                disabled={busy}
                                className={[
                                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-600',
                                    engaged ? 'bg-brand-600' : 'bg-muted',
                                    busy ? 'opacity-60' : '',
                                ].join(' ')}
                                title={engaged ? 'Engagement activé' : 'Activer mon engagement'}
                            >
                                <span
                                    className={[
                                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
                                        engaged ? 'translate-x-5' : 'translate-x-0',
                                    ].join(' ')}
                                />
                            </button>
                        </div>

                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            <li>• Tu peux décocher à tout moment (les jours se reverrouilleront).</li>
                            <li>• Ton état est enregistré (persistance en BDD).</li>
                            <li>• Le Jour 1 se débloque uniquement si l’engagement est actif.</li>
                        </ul>

                        {err && <div className="mt-3 rounded-lg border border-border bg-muted/40 p-2 text-sm text-brand-700">{err}</div>}
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                        {engaged ? <span className="text-foreground">Engagement actif — Jour 1 débloqué.</span> : <span>⚠️ Coche l’engagement pour débloquer le Jour 1.</span>}
                        {showStartedBanner ? <span className="ml-2 text-muted-foreground">(Tu as déjà démarré ce programme.)</span> : null}
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/learn/${slug}`} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted">
                            Vue d’ensemble
                        </Link>
                        <button
                            onClick={onStart}
                            disabled={!engaged || busy}
                            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
                        >
                            {busy ? 'Démarrage…' : 'Commencer la leçon 1'}
                        </button>
                    </div>
                </div>
            </section>

            {/* ===== Modale de désengagement ===== */}
            <FullscreenModal
                open={open}
                onClose={() => {
                    if (!modalBusy) {
                        setOpen(false);
                        setStep2(false);
                        setVal('');
                        setModalErr(null);
                    }
                }}
                title="Désactiver l’engagement ?"
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                if (!modalBusy) {
                                    setOpen(false);
                                    setStep2(false);
                                    setVal('');
                                    setModalErr(null);
                                }
                            }}
                            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                            disabled={modalBusy}
                        >
                            Annuler
                        </button>

                        <button
                            ref={confirmBtnRef}
                            onClick={() => {
                                if (!step2) setStep2(true);
                                else if (canConfirm) onConfirmDisengage();
                            }}
                            disabled={modalBusy || (step2 && !canConfirm)}
                            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                            {!step2 ? 'Oui, désactiver' : modalBusy ? 'Suppression…' : 'Confirmer'}
                        </button>
                    </div>
                }
            >
                {/* Croix */}
                <button
                    onClick={() => {
                        if (!modalBusy) {
                            setOpen(false);
                            setStep2(false);
                            setVal('');
                            setModalErr(null);
                        }
                    }}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Cette action est <span className="font-medium text-foreground">définitive</span>. Elle supprimera :
                    </p>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        <li>toutes tes notes et réponses</li>
                        <li>toutes les pratiques / validations</li>
                        <li>
                            ta progression (remise au <span className="text-foreground">Jour 1</span>)
                        </li>
                    </ul>

                    {step2 && (
                        <div className="rounded-xl border border-border bg-muted/40 p-3">
                            <p className="text-sm text-muted-foreground">
                                Tape <span className="rounded px-1.5 py-0.5 text-foreground ring-1 ring-border">DESENGAGER</span> pour confirmer.
                            </p>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input
                                    value={val}
                                    onChange={(e) => setVal(e.target.value)}
                                    className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-brand-600/40"
                                    placeholder="Écris DESENGAGER pour confirmer"
                                    disabled={modalBusy}
                                />
                                <button
                                    onClick={onConfirmDisengage}
                                    disabled={!canConfirm || modalBusy}
                                    className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                                >
                                    Supprimer & désactiver
                                </button>
                            </div>
                            {modalErr && <div className="mt-2 rounded-lg border border-border bg-muted/40 p-2 text-sm text-brand-700">{modalErr}</div>}
                        </div>
                    )}
                </div>
            </FullscreenModal>
        </>
    );
}
