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

export default function LearnDayClient({
    slug,
    unitId,
    day,
    totalDays,
    prevHref,
    nextHref,
    meta,
    initial,
}: {
    slug: string;
    unitId: string;
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

    // Helpers
    const updateText = useCallback((key: string, value: string) => {
        setData((d) => ({ ...d, [key]: value }));
    }, []);
    const updateSlider = useCallback((key: string, value: number) => {
        setSliders((s) => ({ ...s, [key]: value }));
    }, []);
    const toggleCheck = useCallback((key: 'practiced' | 'mantra3x') => {
        setChecks((c) => ({ ...c, [key]: !c[key] }));
    }, []);

    // Autosave (3–5s debounce -> 1200ms ici pour être réactif)
    useEffect(() => {
        setError(null);
        const t = setTimeout(async () => {
            try {
                setSaving(true);
                const r = await fetch('/api/state', {
                    method: 'PUT',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        programSlug: slug,
                        unitId,
                        data,
                        sliders,
                        practiced: checks.practiced,
                        completed, // on sauvegarde aussi l’état complet si jamais on arrive depuis l’historique
                    }),
                });
                if (!r.ok) throw new Error('Échec de la sauvegarde');
                setLastSaved(new Date().toLocaleTimeString('fr-FR'));
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Erreur inconnue');
            } finally {
                setSaving(false);
            }
        }, 1200);
        return () => clearTimeout(t);
    }, [slug, unitId, data, sliders, checks.practiced, completed]);

    // Conditions de validation : simple et robuste avec ton /api/state actuel
    // → ta route considère completed = practiced && (champs requis si tu en ajoutes côté schéma fields).
    const canValidate = useMemo(() => {
        const hasAnyText = Object.values(data).some((v) => (v ?? '').trim().length > 0) || meta.journal.questions.length === 0;
        return checks.practiced && hasAnyText && !completed;
    }, [checks.practiced, data, meta.journal.questions.length, completed]);

    async function onValidate() {
        setValidating(true);
        setError(null);
        try {
            // marque completed=true -> /api/state fera avancer l’enrollment si condition ok
            const r = await fetch('/api/state', {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    programSlug: slug,
                    unitId,
                    data,
                    sliders,
                    practiced: true,
                    completed: true,
                }),
            });
            if (!r.ok) throw new Error('Validation impossible, réessaie.');
            setCompleted(true);

            // go next or bilan
            if (nextHref) {
                window.location.href = nextHref;
            } else {
                // dernière leçon → bilan/suite
                window.location.href = '/member/bilan';
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setValidating(false);
        }
    }

    return (
        <section className="space-y-6">
            {/* Notes & Journal */}
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

                {/* Checks */}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {meta.journal.checks.map((c) => {
                        const key = c.key === 'pratique' ? 'practiced' : c.key === 'mantra' ? 'mantra3x' : c.key;
                        const checked = key === 'practiced' ? checks.practiced : key === 'mantra3x' ? checks.mantra3x : false;
                        const onChange = key === 'practiced' ? () => toggleCheck('practiced') : key === 'mantra3x' ? () => toggleCheck('mantra3x') : undefined;
                        return (
                            <label key={c.key} className="inline-flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={checked} onChange={onChange} />
                                {c.label}
                            </label>
                        );
                    })}
                </div>

                {/* Sécurité */}
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900">
                    {meta.safetyNote || 'Si tu te sens dépassé·e, fais une pause respiration 2 minutes. Tu peux stopper à tout moment.'}
                </div>

                {/* CTA principal */}
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
    );
}
