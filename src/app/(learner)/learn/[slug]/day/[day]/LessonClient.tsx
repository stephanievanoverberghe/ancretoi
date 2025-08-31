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

/** Normalise les clés des cases à cocher pour éviter les variations (casse, espaces, synonymes) */
function normalizeCheckKey(key?: string, label?: string) {
    const k = (key ?? '').toLowerCase().trim();
    const l = (label ?? '').toLowerCase().trim();

    // Variantes de "pratique / practiced"
    if (['pratique', 'practice', 'practiced', 'fait', 'faite', 'done'].includes(k) || l.includes('pratique') || l.includes('practice')) return 'practiced';

    // Variantes de "mantra (x3)"
    if (['mantra', 'mantra3x', 'mantra_3x', 'mantra×3', 'mantra x3', 'mantra x 3'].includes(k) || l.includes('mantra')) return 'mantra3x';

    // Par défaut, renvoie la clé brute (non interactif si inconnu)
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

    // Helpers
    const updateText = useCallback((key: string, value: string) => setData((d) => ({ ...d, [key]: value })), []);
    const updateSlider = useCallback((key: string, value: number) => setSliders((s) => ({ ...s, [key]: value })), []);
    const toggleCheck = useCallback((key: 'practiced' | 'mantra3x') => setChecks((c) => ({ ...c, [key]: !c[key] })), []);

    // AUTOSAVE -> POST /api/learn/state (inclut practiced & mantra3x)
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
                        patch: {
                            data,
                            sliders,
                            practiced: checks.practiced,
                            mantra3x: checks.mantra3x,
                            completed, // si l’utilisateur revient via l’historique
                        },
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

    // Règles d’activation + raisons affichées
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
            // 1) Marquer le jour complété (persiste aussi mantra3x)
            const r = await fetch('/api/learn/state', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    day,
                    patch: {
                        data,
                        sliders,
                        practiced: true,
                        mantra3x: checks.mantra3x,
                        completed: true,
                    },
                }),
            });
            if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                throw new Error(j?.error || 'Validation impossible (state)');
            }

            // 2) Avancer l’inscription (déverrouille J+1)
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

    const goNext = () => {
        if (nextHref) window.location.href = nextHref;
        else window.location.href = `/learn/${slug}/conclusion`;
    };

    return (
        <>
            <section className="space-y-6">
                <div className="rounded-2xl border bg-white/70 p-5 backdrop-blur">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold">Notes & Journal</h2>
                        <div className="text-xs text-gray-500">{saving ? 'Enregistrement…' : lastSaved ? `Sauvegardé à ${lastSaved}` : '—'}</div>
                    </div>

                    {/* Sliders */}
                    {meta.journal.sliders.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {meta.journal.sliders.map((s) => (
                                <label key={s.key} className="flex items-center gap-3">
                                    <span className="w-28 text-sm">
                                        {s.label} <span className="tabular-nums">{sliders[s.key] ?? 0}/10</span>
                                    </span>
                                    <input
                                        type="range"
                                        min={s.min ?? 0}
                                        max={s.max ?? 10}
                                        step={s.step ?? 1}
                                        value={sliders[s.key] ?? 0}
                                        onChange={(e) => updateSlider(s.key, Number(e.target.value))}
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
                                <label className="text-sm font-medium">{q.label}</label>
                                <textarea
                                    rows={q.key === 'takeaways' ? 4 : 3}
                                    className="mt-1 w-full rounded-xl border bg-white/90 p-3 text-sm"
                                    placeholder={q.placeholder ?? ''}
                                    value={data[q.key] ?? ''}
                                    onChange={(e) => updateText(q.key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Checks (avec normalisation) */}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {meta.journal.checks.map((c) => {
                            const norm = normalizeCheckKey(c.key, c.label);
                            const isPracticed = norm === 'practiced';
                            const isMantra = norm === 'mantra3x';

                            const checked = isPracticed ? checks.practiced : isMantra ? checks.mantra3x : false;

                            const onChange = isPracticed ? () => toggleCheck('practiced') : isMantra ? () => toggleCheck('mantra3x') : undefined;

                            return (
                                <label key={`${c.key}-${c.label}`} className="inline-flex items-center gap-2 text-sm" title={!onChange ? `Clé inconnue: ${c.key}` : undefined}>
                                    <input type="checkbox" name={norm || c.key} checked={checked} onChange={onChange} />
                                    {c.label}
                                    {!onChange && <span className="text-[11px] text-gray-500">(non interactif)</span>}
                                </label>
                            );
                        })}
                    </div>

                    {/* Raisons si bouton grisé */}
                    {(!canValidate || validating) && (
                        <ul className="mt-3 text-xs text-gray-600">
                            {reasons.reqPractice && <li>• Coche “Pratique faite”.</li>}
                            {reasons.reqText && <li>• Écris au moins une réponse dans le journal.</li>}
                        </ul>
                    )}

                    {/* Sécurité */}
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900">
                        {meta.safetyNote || 'Si tu te sens dépassé·e, fais une pause respiration 2 minutes. Tu peux stopper à tout moment.'}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-2">
                            <Link
                                href={prevHref ?? '#'}
                                aria-disabled={!prevHref}
                                className={[
                                    'rounded-lg px-3 py-1.5 text-sm ring-1',
                                    prevHref ? 'ring-slate-300 hover:bg-slate-50' : 'pointer-events-none opacity-50 ring-slate-200',
                                ].join(' ')}
                            >
                                ← Précédent
                            </Link>
                            {nextHref && (
                                <Link href={nextHref} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-slate-300 hover:bg-slate-50">
                                    Suivant →
                                </Link>
                            )}
                        </div>

                        <button
                            onClick={onValidate}
                            disabled={!canValidate || validating}
                            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                            aria-disabled={!canValidate || validating}
                        >
                            {validating ? 'Validation…' : nextHref ? 'Valider la leçon' : 'Terminer le cours'}
                        </button>
                    </div>

                    {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

                    <div className="mt-2 text-xs text-gray-500">
                        Jour {day}/{totalDays}
                    </div>
                </div>
            </section>

            {/* Modal de célébration */}
            {celebrateOpen && (
                <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <div className="relative w-[min(520px,92vw)] overflow-hidden rounded-2xl border border-white/30 bg-white/90 p-6 shadow-2xl">
                        <Confetti />
                        <h3 className="text-xl font-semibold">Jour {String(day).padStart(2, '0')} validé 🎉</h3>
                        <p className="mt-1 text-sm text-gray-600">Bravo ! Tes notes sont enregistrées et le prochain jour est déverrouillé.</p>
                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                            <button
                                onClick={goNext}
                                className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                {nextHref ? 'Passer au jour suivant' : 'Voir le bilan'}
                            </button>
                            <button
                                onClick={() => setCelebrateOpen(false)}
                                className="inline-flex flex-1 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
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
    const colors = ['#6D4AFF', '#60A5FA', '#34D399', '#F59E0B', '#EF4444'];
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
