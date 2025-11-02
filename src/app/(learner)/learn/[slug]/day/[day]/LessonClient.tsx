// src/app/(learner)/learn/[slug]/day/[day]/LessonClient.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Initial = {
    data: Record<string, string>;
    practiced: boolean;
    completed: boolean;
    lastSavedAt: string | null;
};

export default function LearnDayClient({
    slug,
    day,
    prevHref,
    nextHref,
    initial,
}: {
    slug: string;
    day: number;
    prevHref: string | null;
    nextHref: string | null;
    initial: Initial;
}) {
    const [data, setData] = useState<Record<string, string>>(initial.data);
    const [practiced, setPracticed] = useState<boolean>(initial.practiced);
    const [completed, setCompleted] = useState<boolean>(initial.completed);

    const [saving, setSaving] = useState<boolean>(false);
    const [lastSaved, setLastSaved] = useState<string | null>(initial.lastSavedAt);
    const [error, setError] = useState<string | null>(null);
    const [validating, setValidating] = useState(false);
    const [notesOpen, setNotesOpen] = useState(Object.keys(initial.data || {}).length > 0);

    const isFirstDay = day <= 1;
    const backHref = prevHref ?? `/learn/${slug}/intro`;
    const backLabel = isFirstDay ? '← Introduction' : '← Précédent';

    const updateText = useCallback((key: string, value: string) => {
        setData((d) => ({ ...d, [key]: value }));
    }, []);

    // Toggle réversible : enregistre tout de suite et recule le focus si on décoche
    async function onTogglePracticed(next: boolean) {
        setError(null);

        // Optimiste
        setPracticed(next);
        let nextCompleted = completed;

        if (!next && completed) {
            nextCompleted = false;
            setCompleted(false);
        }

        try {
            setSaving(true);

            // 1) Persist state immédiatement (sans attendre le debounce)
            const r = await fetch('/api/learn/state', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, day, patch: { data, practiced: next, completed: nextCompleted } }),
            });

            if (!r.ok) {
                const j: unknown = await r.json().catch(() => ({}));
                throw new Error((j as { error?: string } | undefined)?.error || 'Échec de la sauvegarde');
            }
            setLastSaved(new Date().toLocaleTimeString('fr-FR'));

            // 2) Si on décoche, recalcul du focus
            if (!next) {
                const p = await fetch('/api/learn/progress', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ slug, action: 'reopenDay', day }),
                });

                if (p.ok) {
                    const j: { ok: true; currentDay: number; toIntro?: boolean } = await p.json();
                    if (j.toIntro) {
                        window.location.href = `/learn/${slug}/intro`;
                    } else {
                        const target = String(j.currentDay).padStart(2, '0');
                        window.location.href = `/learn/${slug}/day/${target}`;
                    }
                    return;
                }
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue');
            // rollback
            setPracticed(!next);
            setCompleted(completed);
        } finally {
            setSaving(false);
        }
    }

    // AUTOSAVE (notes et état courant)
    useEffect(() => {
        setError(null);
        const t = setTimeout(async () => {
            try {
                setSaving(true);
                const r = await fetch('/api/learn/state', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ slug, day, patch: { data, practiced, completed } }),
                });
                if (!r.ok) {
                    const j: unknown = await r.json().catch(() => ({}));
                    throw new Error((j as { error?: string } | undefined)?.error || 'Échec de la sauvegarde');
                }
                setLastSaved(new Date().toLocaleTimeString('fr-FR'));
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Erreur inconnue');
            } finally {
                setSaving(false);
            }
        }, 700);
        return () => clearTimeout(t);
    }, [slug, day, data, practiced, completed]);

    const canValidate = useMemo(() => !completed && practiced, [completed, practiced]);

    async function onValidate() {
        if (!canValidate) return;
        setValidating(true);
        setError(null);
        try {
            // 1) State → mark completed
            const r = await fetch('/api/learn/state', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, day, patch: { data, practiced: true, completed: true } }),
            });
            if (!r.ok) {
                const j: unknown = await r.json().catch(() => ({}));
                throw new Error((j as { error?: string } | undefined)?.error || 'Validation impossible (state)');
            }

            // 2) Progression → avance
            const p = await fetch('/api/learn/progress', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ slug, action: 'completeDay', day }),
            });
            if (!p.ok) {
                const j: unknown = await p.json().catch(() => ({}));
                throw new Error((j as { error?: string } | undefined)?.error || 'Validation impossible (progress)');
            }

            setCompleted(true);
            if (nextHref) window.location.href = nextHref;
            else window.location.href = `/learn/${slug}/conclusion`;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setValidating(false);
        }
    }

    return (
        <section className="mt-4 space-y-4">
            {/* Bloc actions */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                {/* Switch pratique */}
                <label className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm">
                    <span className="inline-flex items-center gap-2 text-foreground">
                        <input type="checkbox" className="size-4" checked={practiced} onChange={(e) => onTogglePracticed(e.target.checked)} />
                        Pratique faite
                    </span>
                    <span className={['rounded-full px-2 py-0.5 text-[11px] ring-1', practiced ? 'ring-brand-600 text-brand-600' : 'ring-border text-muted-foreground'].join(' ')}>
                        {practiced ? 'OK' : 'À faire'}
                    </span>
                </label>

                {/* Notes */}
                <div className="mt-3">
                    <button type="button" onClick={() => setNotesOpen((v) => !v)} className="text-sm underline underline-offset-4 text-muted-foreground">
                        {notesOpen ? 'Masquer les notes' : 'Ajouter une note'}
                    </button>
                    {notesOpen && (
                        <div className="mt-2">
                            <textarea
                                rows={4}
                                className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground outline-none focus:border-brand-600/40"
                                placeholder="Tes notes (optionnel)…"
                                value={data.notes ?? ''}
                                onChange={(e) => updateText('notes', e.target.value)}
                            />
                            <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">{(data.notes ?? '').trim().length} car.</div>
                        </div>
                    )}
                </div>

                {/* État sauvegarde / erreurs */}
                <div className="mt-3 text-[12px]" aria-live="polite">
                    {error ? (
                        <span className="text-brand-700">{error}</span>
                    ) : lastSaved ? (
                        <span className="text-muted-foreground">Sauvegardé {lastSaved}</span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )}
                </div>
            </div>

            {/* Footer sticky */}
            <div className="sticky bottom-0 z-30 -mx-4 border-t border-border/70 bg-background/85 px-4 py-3 backdrop-blur">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
                    <Link href={backHref} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted">
                        {backLabel}
                    </Link>

                    <div className="flex items-center gap-2">
                        <span
                            className={[
                                'hidden sm:inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px]',
                                saving ? 'bg-muted text-muted-foreground' : 'bg-card ring-1 ring-inset ring-border text-muted-foreground',
                            ].join(' ')}
                            aria-live="polite"
                        >
                            <span className={['inline-block h-1.5 w-1.5 rounded-full', saving ? 'animate-pulse' : ''].join(' ')} />
                            {saving ? 'Enregistrement…' : lastSaved ? `Sauvegardé ${lastSaved}` : '—'}
                        </span>

                        {nextHref && (
                            <Link href={nextHref} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted">
                                Suivant →
                            </Link>
                        )}

                        <button
                            onClick={onValidate}
                            disabled={!canValidate || validating}
                            className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
                            aria-disabled={!canValidate || validating}
                            title={canValidate ? 'Valider' : 'Coche “Pratique faite” pour valider'}
                        >
                            {validating ? 'Validation…' : nextHref ? 'Valider' : 'Terminer'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
