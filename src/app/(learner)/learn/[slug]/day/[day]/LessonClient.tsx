// src/app/(learner)/learn/[slug]/day/[day]/LessonClient.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
    const [checks, setChecks] = useState<{ practiced: boolean; mantra3x: boolean }>({ practiced: initial.practiced, mantra3x: initial.mantra3x });
    const [completed, setCompleted] = useState<boolean>(initial.completed);
    const [saving, setSaving] = useState<boolean>(false);
    const [lastSaved, setLastSaved] = useState<string | null>(initial.lastSavedAt);
    const [error, setError] = useState<string | null>(null);
    const [validating, setValidating] = useState(false);
    const [celebrateOpen, setCelebrateOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false); // ⬅️ modale de confirmation

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
        }, 1200);
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
            window.location.href = prevHref;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setValidating(false);
        }
    };

    // 🗑️ Effacer ce jour (DELETE DayState en DB + remettre currentDay sur ce jour) puis rediriger vers J-1
    const onConfirmReset = async () => {
        try {
            setValidating(true);
            const r = await fetch(`/api/learn/state?slug=${encodeURIComponent(slug)}&day=${day}`, { method: 'DELETE' });
            if (!r.ok) throw new Error('Impossible de réinitialiser ce jour');

            // Reset UI local (au cas où on resterait)
            setData({});
            setSliders({});
            setChecks({ practiced: false, mantra3x: false });
            setCompleted(false);
            setLastSaved(null);
            setCelebrateOpen(false);
            setConfirmOpen(false);

            // Redirection vers le jour précédent si possible
            if (prevHref) {
                window.location.href = prevHref;
            } else {
                // Si pas de J-1 (ex: jour 1), on revient à la page du programme
                window.location.href = `/learn/${slug}`;
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue');
            setConfirmOpen(false);
        } finally {
            setValidating(false);
        }
    };

    const goNext = () => {
        if (nextHref) window.location.href = nextHref;
        else window.location.href = `/learn/${slug}/conclusion`;
    };

    return (
        <>
            <section className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-5 backdrop-blur">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold text-foreground">Notes & Journal</h2>
                        <div className="text-xs text-muted-foreground">{saving ? 'Enregistrement…' : lastSaved ? `Sauvegardé à ${lastSaved}` : '—'}</div>
                    </div>

                    {/* Sliders */}
                    {meta.journal.sliders.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {meta.journal.sliders.map((s) => (
                                <label key={s.key} className="flex items-center gap-3 text-foreground">
                                    <span className="w-28 text-sm">
                                        {s.label} <span className="tabular-nums">{sliders[s.key] ?? 0}/10</span>
                                    </span>
                                    <input
                                        type="range"
                                        min={s.min ?? 0}
                                        max={s.max ?? 10}
                                        step={s.step ?? 1}
                                        value={sliders[s.key] ?? 0}
                                        onChange={(e) => setSliders((x) => ({ ...x, [s.key]: Number(e.target.value) }))}
                                        className="flex-1"
                                    />
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Questions */}
                    <div className="mt-4 grid gap-4">
                        {meta.journal.questions.map((q) => (
                            <div key={q.key}>
                                <label className="text-sm font-medium text-foreground">{q.label}</label>
                                <textarea
                                    rows={q.key === 'takeaways' ? 4 : 3}
                                    className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground"
                                    placeholder={q.placeholder ?? ''}
                                    value={data[q.key] ?? ''}
                                    onChange={(e) => updateText(q.key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Checks */}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {meta.journal.checks.map((c) => {
                            const norm = normalizeCheckKey(c.key, c.label);
                            const isPracticed = norm === 'practiced';
                            const isMantra = norm === 'mantra3x';
                            const checked = isPracticed ? checks.practiced : isMantra ? checks.mantra3x : false;
                            const onChange = isPracticed ? () => toggleCheck('practiced') : isMantra ? () => toggleCheck('mantra3x') : undefined;

                            return (
                                <label
                                    key={`${c.key}-${c.label}`}
                                    className="inline-flex items-center gap-2 text-sm text-foreground"
                                    title={!onChange ? `Clé inconnue: ${c.key}` : undefined}
                                >
                                    <input type="checkbox" name={norm || c.key} checked={checked} onChange={onChange} />
                                    {c.label}
                                    {!onChange && <span className="text-[11px] text-muted-foreground">(non interactif)</span>}
                                </label>
                            );
                        })}
                    </div>

                    {/* Raisons si bouton grisé */}
                    {(!canValidate || validating) && (
                        <ul className="mt-3 text-xs text-muted-foreground">
                            {reasons.reqPractice && <li>• Coche “Pratique faite”.</li>}
                            {reasons.reqText && <li>• Écris au moins une réponse dans le journal.</li>}
                        </ul>
                    )}

                    {/* Sécurité */}
                    <div className="mt-5 rounded-xl border border-border bg-muted/60 p-3 text-sm text-foreground">
                        {meta.safetyNote || 'Si tu te sens dépassé·e, fais une pause respiration 2 minutes. Tu peux stopper à tout moment.'}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={prevHref ?? '#'}
                                aria-disabled={!prevHref}
                                className={['rounded-lg px-3 py-1.5 text-sm ring-1', prevHref ? 'ring-border hover:bg-muted' : 'pointer-events-none opacity-50 ring-border'].join(
                                    ' '
                                )}
                            >
                                ← Précédent
                            </Link>

                            {prevHref && (
                                <button
                                    type="button"
                                    onClick={onReopenPrev}
                                    disabled={validating}
                                    className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted"
                                    title="Revenir sur le jour précédent (ré-ouvre J-1 dans la progression)"
                                >
                                    Ré-ouvrir J-1
                                </button>
                            )}

                            {nextHref && (
                                <Link href={nextHref} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted">
                                    Suivant →
                                </Link>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={onValidate}
                                disabled={!canValidate || validating}
                                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
                                aria-disabled={!canValidate || validating}
                            >
                                {validating ? 'Validation…' : nextHref ? 'Valider la leçon' : 'Terminer le cours'}
                            </button>

                            {/* Ouvre la modale de confirmation */}
                            <button
                                type="button"
                                onClick={() => setConfirmOpen(true)}
                                disabled={validating}
                                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                title="Effacer les données de ce jour"
                            >
                                Effacer ce jour
                            </button>
                        </div>
                    </div>

                    {error && <div className="mt-2 text-sm text-brand-700">{error}</div>}

                    <div className="mt-2 text-xs text-muted-foreground">
                        Jour {day}/{totalDays}
                    </div>
                </div>
            </section>

            {/* Modal de confirmation effacement */}
            {confirmOpen && (
                <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <div className="w-[min(520px,92vw)] rounded-2xl border border-border bg-card p-5 shadow-xl">
                        <h3 className="text-lg font-semibold text-foreground">Effacer ce jour ?</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Cette action est <strong className="font-semibold text-foreground">définitive</strong>. Toutes les données de ce jour seront supprimées&nbsp;:
                        </p>
                        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                            <li>Notes et réponses du journal</li>
                            <li>Valeurs des curseurs</li>
                            <li>États “Pratique faite”, “Mantra 3×” et “Terminé”</li>
                        </ul>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Après suppression, tu seras redirigé·e vers le <span className="text-foreground">jour précédent</span>.
                        </p>

                        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => setConfirmOpen(false)}
                                className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={onConfirmReset}
                                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                            >
                                Oui, effacer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de célébration (inchangée) */}
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
