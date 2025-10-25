// src/app/(learner)/learn/[slug]/day/[day]/LessonClient.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type Meta = {
    durationMin: number;
    safetyNote: string;
    journal: {
        sliders: { key: string; label: string; min?: number; max?: number; step?: number }[];
        questions: { key: string; label: string; placeholder?: string }[];
        checks: { key: string; label: string }[];
    };
};

type Initial = {
    data: Record<string, string>;
    sliders: { [k: string]: number };
    practiced: boolean;
    mantra3x: boolean;
    completed: boolean;
    lastSavedAt: string | null;
};

/** Normalise les clés des cases à cocher */
function normalizeCheckKey(key?: string, label?: string) {
    const k = (key ?? '').toLowerCase().trim();
    const l = (label ?? '').toLowerCase().trim();
    if (['pratique', 'practice', 'practiced', 'fait', 'faite', 'done'].includes(k) || l.includes('pratique') || l.includes('practice')) return 'practiced';
    if (['mantra', 'mantra3x', 'mantra_3x', 'mantra×3', 'mantra x3', 'mantra x 3'].includes(k) || l.includes('mantra')) return 'mantra3x';
    return k;
}

export default function LearnDayClient({
    slug,
    day,
    totalDays,
    prevHref,
    nextHref,
    meta,
    initial,
}: {
    slug: string;
    day: number;
    totalDays: number;
    prevHref: string | null;
    nextHref: string | null;
    meta: Meta;
    initial: Initial;
}) {
    const [data, setData] = useState<Record<string, string>>(initial.data);
    const [sliders, setSliders] = useState<Record<string, number>>(initial.sliders);
    const [checks, setChecks] = useState<{ practiced: boolean; mantra3x: boolean }>({
        practiced: initial.practiced,
        mantra3x: initial.mantra3x,
    });
    const [completed, setCompleted] = useState<boolean>(initial.completed);

    const [saving, setSaving] = useState<boolean>(false);
    const [lastSaved, setLastSaved] = useState<string | null>(initial.lastSavedAt);
    const [error, setError] = useState<string | null>(null);
    const [validating, setValidating] = useState(false);

    const [celebrateOpen, setCelebrateOpen] = useState(false);

    // Modale destructive
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmStep2, setConfirmStep2] = useState(false);
    const confirmRef = useRef<HTMLButtonElement | null>(null);

    // Jour 1 : on propose retour à l'intro à la place d'un lien mort.
    const isFirstDay = day <= 1;
    const backHref = prevHref ?? `/learn/${slug}/intro`;
    const backLabel = isFirstDay ? '← Introduction' : '← Précédent';

    // Helpers
    const updateText = useCallback((key: string, value: string) => setData((d) => ({ ...d, [key]: value })), []);
    const updateSlider = useCallback((key: string, value: number) => setSliders((s) => ({ ...s, [key]: value })), []);
    const toggleCheck = useCallback((key: 'practiced' | 'mantra3x') => setChecks((c) => ({ ...c, [key]: !c[key] })), []);

    // AUTOSAVE
    useEffect(() => {
        setError(null);
        const t = setTimeout(async () => {
            try {
                setSaving(true);
                const r = await fetch('/api/learn/state', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        slug,
                        day,
                        patch: { data, sliders, practiced: checks.practiced, mantra3x: checks.mantra3x, completed },
                    }),
                });
                if (!r.ok) {
                    const j = await r.json().catch(() => ({}));
                    throw new Error(j?.error || 'Échec de la sauvegarde');
                }
                setLastSaved(new Date().toLocaleTimeString('fr-FR'));
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Erreur inconnue');
            } finally {
                setSaving(false);
            }
        }, 800);
        return () => clearTimeout(t);
    }, [slug, day, data, sliders, checks.practiced, checks.mantra3x, completed]);

    // Conditions de validation
    const reasons = useMemo(() => {
        const reqText = meta.journal.questions.length > 0 && !Object.values(data).some((v) => (v ?? '').trim().length > 0);
        const reqPractice = !checks.practiced;
        return { reqText, reqPractice };
    }, [data, checks.practiced, meta.journal.questions.length]);

    const canValidate = useMemo(() => !completed && !reasons.reqText && !reasons.reqPractice, [completed, reasons]);

    async function onValidate() {
        if (!canValidate) return;
        setValidating(true);
        setError(null);
        try {
            const r = await fetch('/api/learn/state', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    day,
                    patch: { data, sliders, practiced: true, mantra3x: checks.mantra3x, completed: true },
                }),
            });
            if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                throw new Error(j?.error || 'Validation impossible (state)');
            }
            const p = await fetch('/api/learn/progress', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, action: 'completeDay', day }),
            });
            if (!p.ok) {
                const j = await p.json().catch(() => ({}));
                throw new Error(j?.error || 'Validation impossible (progress)');
            }
            setCompleted(true);
            setCelebrateOpen(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setValidating(false);
        }
    }

    // 🔙 Ré-ouvrir J-1 (ramène currentDay en DB et redirige vers prevHref)
    const onReopenPrev = async () => {
        if (!prevHref) return;
        try {
            setValidating(true);
            const r = await fetch('/api/learn/progress', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, action: 'reopenDay', day: day - 1 }),
            });
            if (!r.ok) throw new Error('Impossible de ré-ouvrir J-1');
            window.location.href = prevHref!;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setValidating(false);
        }
    };

    // 🗑️ Effacer ce jour → DELETE + progression cohérente + redirection adaptée
    const onConfirmReset = async () => {
        try {
            setValidating(true);

            // 1) Supprime l'état du jour
            const del = await fetch(`/api/learn/state?slug=${encodeURIComponent(slug)}&day=${day}`, { method: 'DELETE' });
            if (!del.ok) throw new Error('Impossible de réinitialiser ce jour');

            // 2) Sécurise la progression (au cas où le DELETE ne l’ajuste pas)
            const target = isFirstDay ? 1 : day - 1;
            await fetch('/api/learn/progress', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, action: 'setDay', day: target }),
            }).catch(() => {
                /* best effort */
            });

            // 3) Reset UI local (si retour via historique)
            setData({});
            setSliders({});
            setChecks({ practiced: false, mantra3x: false });
            setCompleted(false);
            setLastSaved(null);
            setCelebrateOpen(false);
            setConfirmOpen(false);
            setConfirmStep2(false);

            // 4) Redirection
            window.location.href = backHref;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue');
            setConfirmOpen(false);
            setConfirmStep2(false);
        } finally {
            setValidating(false);
        }
    };

    const goNext = () => {
        if (nextHref) window.location.href = nextHref;
        else window.location.href = `/learn/${slug}/conclusion`;
    };

    // A11y: focus premier bouton de la modale à l’ouverture
    useEffect(() => {
        if (confirmOpen) setTimeout(() => confirmRef.current?.focus(), 0);
    }, [confirmOpen]);

    return (
        <>
            {/* Barre sticky */}
            <div className="sticky top-0 z-30 -mx-4 mb-4 rounded-b-xl border-b border-border/80 bg-card/80 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Link
                            href={backHref}
                            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted"
                            title={isFirstDay ? 'Retour à l’introduction' : 'Jour précédent'}
                        >
                            {backLabel}
                        </Link>

                        {!isFirstDay && prevHref && (
                            <button
                                type="button"
                                onClick={onReopenPrev}
                                disabled={validating}
                                className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted"
                                title="Ré-ouvrir J-1 (revient en arrière dans la progression)"
                            >
                                Ré-ouvrir J-1
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className={[
                                'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs',
                                saving ? 'bg-muted text-muted-foreground' : 'bg-card ring-1 ring-inset ring-border text-muted-foreground',
                            ].join(' ')}
                            aria-live="polite"
                        >
                            <span className={['inline-block h-1.5 w-1.5 rounded-full', saving ? 'animate-pulse bg-brand-600' : 'bg-muted-foreground/50'].join(' ')} />
                            {saving ? 'Enregistrement…' : lastSaved ? `Sauvegardé à ${lastSaved}` : '—'}
                        </span>

                        {nextHref && (
                            <Link href={nextHref} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted" title="Jour suivant">
                                Suivant →
                            </Link>
                        )}

                        <button
                            onClick={() => setConfirmOpen(true)}
                            disabled={validating}
                            className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted"
                            title="Effacer les données de ce jour"
                        >
                            Effacer
                        </button>

                        <button
                            onClick={onValidate}
                            disabled={!canValidate || validating}
                            className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
                            aria-disabled={!canValidate || validating}
                            title={canValidate ? 'Valider cette leçon' : 'Complète d’abord les prérequis'}
                        >
                            {validating ? 'Validation…' : nextHref ? 'Valider' : 'Terminer'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Carte principale (inchangée visuellement) */}
            <section className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <h2 className="text-base font-semibold text-foreground">Notes & Journal</h2>
                        <div className="text-xs text-muted-foreground">
                            Jour {day}/{totalDays} · ⏱ {meta.durationMin ?? 25} min
                        </div>
                    </div>

                    {meta.journal.sliders.length > 0 && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {meta.journal.sliders.map((s) => {
                                const val = sliders[s.key] ?? 0;
                                return (
                                    <div key={s.key} className="rounded-xl border border-border/80 p-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-sm text-foreground">{s.label}</span>
                                            <span className="rounded-full px-2 py-0.5 text-xs text-foreground ring-1 ring-border tabular-nums">{val}/10</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={s.min ?? 0}
                                            max={s.max ?? 10}
                                            step={s.step ?? 1}
                                            value={val}
                                            onChange={(e) => updateSlider(s.key, Number(e.target.value))}
                                            className="w-full accent-[var(--brand-600)]"
                                        />
                                        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                                            <span>Bas</span>
                                            <span>Moyen</span>
                                            <span>Haut</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-5 grid gap-4">
                        {meta.journal.questions.map((q) => {
                            const val = data[q.key] ?? '';
                            const count = val.trim().length;
                            return (
                                <div key={q.key} className="group">
                                    <div className="mb-1 flex items-center justify-between">
                                        <label className="text-sm font-medium text-foreground">{q.label}</label>
                                        <span className="text-[11px] text-muted-foreground tabular-nums">{count} car.</span>
                                    </div>
                                    <textarea
                                        rows={q.key === 'takeaways' ? 4 : 3}
                                        className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground outline-none ring-0 transition focus:border-brand-600/40"
                                        placeholder={q.placeholder ?? ''}
                                        value={val}
                                        onChange={(e) => updateText(q.key, e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        {meta.journal.checks.map((c) => {
                            const norm = normalizeCheckKey(c.key, c.label);
                            const isPracticed = norm === 'practiced';
                            const isMantra = norm === 'mantra3x';
                            const checked = isPracticed ? checks.practiced : isMantra ? checks.mantra3x : false;
                            const onChange = isPracticed ? () => toggleCheck('practiced') : isMantra ? () => toggleCheck('mantra3x') : undefined;

                            return (
                                <label key={`${c.key}-${c.label}`} className="flex items-center justify-between rounded-xl border border-border/80 px-3 py-2 text-sm">
                                    <span className="inline-flex items-center gap-2 text-foreground">
                                        <input type="checkbox" className="size-4" name={norm || c.key} checked={checked} onChange={onChange} />
                                        {c.label}
                                    </span>
                                    <span
                                        className={[
                                            'rounded-full px-2 py-0.5 text-[11px] ring-1',
                                            checked ? 'ring-brand-600 text-brand-600' : 'ring-border text-muted-foreground',
                                        ].join(' ')}
                                    >
                                        {checked ? 'OK' : 'À faire'}
                                    </span>
                                </label>
                            );
                        })}
                    </div>

                    {(!canValidate || validating) && (
                        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
                            <ul className="text-xs text-muted-foreground leading-relaxed">
                                {reasons.reqPractice && <li>• Coche “Pratique faite”.</li>}
                                {reasons.reqText && <li>• Écris au moins une réponse dans le journal.</li>}
                            </ul>
                        </div>
                    )}

                    <div className="mt-5 rounded-xl border border-border bg-muted/60 p-3 text-sm text-foreground">
                        {meta.safetyNote || 'Si tu te sens dépassé·e, fais une pause respiration 2 minutes. Tu peux stopper à tout moment.'}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs text-muted-foreground">
                            {error ? <span className="text-brand-700">{error}</span> : lastSaved ? `Sauvegardé à ${lastSaved}` : '—'}
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={backHref} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted">
                                {backLabel}
                            </Link>
                            {nextHref && (
                                <Link href={nextHref} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted">
                                    Suivant →
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal effacement — 2 étapes, texte adapté Jour 1 */}
            {confirmOpen && (
                <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <div className="w-[min(560px,92vw)] rounded-2xl border border-border bg-card p-5 shadow-2xl">
                        <div className="flex items-start gap-3">
                            <div className="grid h-8 w-8 place-items-center rounded-full bg-muted/80 text-foreground">🗑️</div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-foreground">Effacer ce jour ?</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Cette action est <span className="font-medium text-foreground">définitive</span>. Toutes les données de ce jour seront supprimées :
                                </p>
                                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                                    <li>Notes et réponses du journal</li>
                                    <li>Valeurs des curseurs</li>
                                    <li>États “Pratique faite”, “Mantra 3×” et “Terminé”</li>
                                </ul>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Après suppression, tu seras redirigé·e vers <span className="text-foreground">{isFirstDay ? "l'introduction" : 'le jour précédent'}</span>.
                                </p>
                            </div>
                        </div>

                        {confirmStep2 ? (
                            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                                Tape <span className="rounded px-1.5 py-0.5 text-foreground ring-1 ring-border">EFFACER</span> ci-dessous pour confirmer.
                                <ConfirmInput
                                    onConfirm={onConfirmReset}
                                    onCancel={() => {
                                        setConfirmStep2(false);
                                        setConfirmOpen(false);
                                    }}
                                />
                            </div>
                        ) : null}

                        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                ref={confirmRef}
                                onClick={() => {
                                    if (!confirmStep2) setConfirmStep2(true);
                                }}
                                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                            >
                                {confirmStep2 ? 'Confirmer' : 'Oui, effacer'}
                            </button>
                            <button
                                onClick={() => {
                                    setConfirmOpen(false);
                                    setConfirmStep2(false);
                                }}
                                className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de célébration */}
            {celebrateOpen && (
                <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <div className="relative w-[min(520px,92vw)] overflow-hidden rounded-2xl border border-border bg-card/90 p-6 shadow-2xl">
                        <Confetti />
                        <h3 className="text-xl font-semibold text-foreground">Jour {String(day).padStart(2, '0')} validé 🎉</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Bravo ! Tes notes sont enregistrées et le prochain jour est déverrouillé.</p>
                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                            <button
                                onClick={goNext}
                                className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                            >
                                {nextHref ? 'Passer au jour suivant' : 'Voir le bilan'}
                            </button>
                            <button
                                onClick={() => setCelebrateOpen(false)}
                                className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                            >
                                Rester sur cette page
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ---------- petits composants ---------- */

function ConfirmInput({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    const [val, setVal] = useState('');
    const can = val.trim().toUpperCase() === 'EFFACER';
    return (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-brand-600/40"
                placeholder="Écris EFFACER pour confirmer"
            />
            <div className="flex gap-2">
                <button disabled={!can} onClick={onConfirm} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                    Supprimer
                </button>
                <button onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                    Annuler
                </button>
            </div>
        </div>
    );
}

function Confetti() {
    const pieces = Array.from({ length: 12 });
    const colors = ['var(--brand-600)', 'var(--secondary-500)', 'var(--gold-500)'];
    return (
        <>
            <div className="pointer-events-none absolute inset-0">
                {pieces.map((_, i) => (
                    <span
                        key={i}
                        className="absolute h-2 w-2"
                        style={{
                            left: `${8 + i * (84 / 11)}%`,
                            top: '0%',
                            background: colors[i % colors.length],
                            borderRadius: 2,
                            animation: `drop 900ms ease-out ${i * 40}ms both`,
                            transform: `rotate(${(i % 5) * 18 - 36}deg)`,
                        }}
                    />
                ))}
            </div>
            <style jsx>{`
                @keyframes drop {
                    0% {
                        transform: translateY(-10px) rotate(0deg);
                        opacity: 0;
                    }
                    20% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(140px) rotate(220deg);
                        opacity: 0;
                    }
                }
            `}</style>
        </>
    );
}
