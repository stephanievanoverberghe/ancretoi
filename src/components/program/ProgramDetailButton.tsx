// src/components/program/ProgramDetailButton.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import FullscreenModal from '@/components/ui/FullscreenModal';

type Summary = {
    ok: true;
    programSlug: string;
    title: string;
    subtitle: string | null;
    coverUrl: string | null;
    coverAlt: string | null;
    total: number;
    currentDay: number;
    done: number;
    percent: number;
    status: 'active' | 'completed' | 'paused';
    level?: string | null;
    durationDays?: number | null;
    dailyLoadLabel?: string | null;
};

type PlanOk = { ok: true; days: Array<{ index: number; title?: string | null }> };
type PlanErr = { ok: false; error: string };
type PlanResp = PlanOk | PlanErr;

const pad2 = (n: number) => String(n).padStart(2, '0');
const isSummary = (x: unknown): x is Summary => typeof x === 'object' && x !== null && (x as { ok?: boolean }).ok === true;
const isPlanOk = (x: unknown): x is PlanOk => typeof x === 'object' && x !== null && (x as { ok?: boolean }).ok === true && Array.isArray((x as { days?: unknown }).days);
const normalizeSrc = (u: string | null) => (!u ? null : u.startsWith('http') || u.startsWith('data:') || u.startsWith('/') ? u : '/' + u.replace(/^public\//, ''));
const isDataUrl = (u: string | null) => !!u && u.startsWith('data:');

export default function ProgramDetailButton({
    slug,
    children, // render-prop: (open) => ReactNode
}: {
    slug: string;
    children?: (open: () => void) => React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [tab, setTab] = useState<'overview' | 'plan'>('overview');
    const [planLoading, setPlanLoading] = useState(false);
    const [plan, setPlan] = useState<PlanResp | null>(null);

    const loadSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const r = await fetch(`/api/programs/${encodeURIComponent(slug)}/summary`, { cache: 'no-store' });
            const j: unknown = await r.json();
            if (!r.ok || !isSummary(j)) throw new Error((j as { error?: string })?.error || 'Impossible de charger les détails.');
            setSummary(j);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Réseau indisponible.');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    const loadPlan = useCallback(async () => {
        if (planLoading || plan) return;
        setPlanLoading(true);
        try {
            const r = await fetch(`/api/programs/${encodeURIComponent(slug)}/plan?limit=10`, { cache: 'no-store' });
            const j: unknown = await r.json();
            if (!r.ok || !isPlanOk(j)) setPlan({ ok: false, error: (j as { error?: string })?.error || 'Plan indisponible.' });
            else setPlan(j);
        } catch {
            setPlan({ ok: false, error: 'Plan indisponible.' });
        } finally {
            setPlanLoading(false);
        }
    }, [slug, plan, planLoading]);

    useEffect(() => {
        if (open && !summary && !loading && !error) void loadSummary();
    }, [open, summary, loading, error, loadSummary]);

    useEffect(() => {
        if (open && tab === 'plan') void loadPlan();
    }, [open, tab, loadPlan]);

    const cta = useMemo(() => {
        if (!summary) return null;
        const isNew = summary.done === 0;
        const href = isNew ? `/learn/${summary.programSlug}/intro` : `/learn/${summary.programSlug}/day/${pad2(summary.currentDay)}`;
        return { href, label: isNew ? 'Commencer' : 'Continuer' };
    }, [summary]);

    const normalizedCover = normalizeSrc(summary?.coverUrl ?? null);

    const defaultTrigger = (
        <button
            type="button"
            onClick={() => {
                setOpen(true);
                setTab('overview');
            }}
            className="inline-flex items-center justify-center rounded-xl cursor-pointer border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
        >
            Détails
        </button>
    );

    return (
        <>
            {children
                ? children(() => {
                      setOpen(true);
                      setTab('overview');
                  })
                : defaultTrigger}

            <FullscreenModal
                open={open}
                onClose={() => setOpen(false)}
                title={summary ? summary.title : 'Détails du programme'}
                closeOnBackdrop // clic dehors ok
                closeOnEsc // ESC ok
                footer={
                    summary && cta ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={cta.href}
                                className="inline-flex items-center justify-center cursor-pointer rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                                onClick={() => setOpen(false)}
                            >
                                {cta.label}
                            </Link>

                            {summary.status === 'completed' ? (
                                <Link
                                    href={`/learn/${summary.programSlug}/day/01`}
                                    className="inline-flex items-center justify-center cursor-pointer rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
                                    onClick={() => setOpen(false)}
                                >
                                    Revisiter depuis le début
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setTab('plan')}
                                    className="inline-flex items-center justify-center cursor-pointer rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
                                >
                                    Voir le plan
                                </button>
                            )}
                        </div>
                    ) : null
                }
            >
                {/* Croix qui ferme + retourne à /member si besoin */}
                <button
                    onClick={() => {
                        setOpen(false);
                        router.push('/member');
                    }}
                    aria-label="Fermer et revenir"
                    className="absolute right-4 top-4 rounded-full border border-border bg-white/80 p-1.5 shadow-sm transition hover:bg-white cursor-pointer"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Header visuel */}
                {summary && (
                    <div className="mb-4 overflow-hidden rounded-2xl ring-1 ring-brand-100/60">
                        <div className="relative h-40 w-full bg-muted sm:h-48">
                            {normalizedCover ? (
                                <Image
                                    src={normalizedCover}
                                    alt={summary.coverAlt ?? ''}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 800px"
                                    unoptimized={isDataUrl(normalizedCover)}
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">Aucune image</div>
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                        </div>

                        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                            <div className="min-w-0">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">{summary.programSlug}</p>
                                <h4 className="truncate text-lg font-semibold text-foreground">{summary.title}</h4>
                                {summary.subtitle ? <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{summary.subtitle}</p> : null}
                            </div>

                            <ul className="flex flex-wrap gap-2">
                                {summary.level && (
                                    <li className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">{summary.level}</li>
                                )}
                                {summary.durationDays && <li className="rounded-full border border-border bg-background px-2.5 py-1 text-xs">⏱ {summary.durationDays} j</li>}
                                {summary.dailyLoadLabel && <li className="rounded-full border border-border bg-background px-2.5 py-1 text-xs">⚡ {summary.dailyLoadLabel}</li>}
                            </ul>
                        </div>

                        <div className="px-4 pb-4">
                            <div
                                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={summary.percent}
                            >
                                <div className="h-full bg-brand-600 transition-[width] duration-500" style={{ width: `${summary.percent}%` }} />
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    {summary.done}/{summary.total} — {summary.percent}%
                                </span>
                                <span>{summary.status === 'completed' ? 'Terminé ✅' : `Prochain · Jour ${pad2(summary.currentDay)}`}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-3 flex gap-1 rounded-lg border border-border bg-background p-1 text-sm">
                    <button
                        className={`flex-1 rounded-md px-3 py-1. cursor-pointer ${tab === 'overview' ? 'bg-white font-medium ring-1 ring-border' : 'hover:bg-white/60'}`}
                        onClick={() => setTab('overview')}
                        type="button"
                    >
                        Aperçu
                    </button>
                    <button
                        className={`flex-1 rounded-md px-3 py-1.5 cursor-pointer ${tab === 'plan' ? 'bg-white font-medium ring-1 ring-border' : 'hover:bg-white/60'}`}
                        onClick={() => setTab('plan')}
                        type="button"
                    >
                        Plan
                    </button>
                </div>

                {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
                {error && <p className="text-sm text-brand-700">{error}</p>}

                {!loading && !error && summary && (
                    <>
                        {tab === 'overview' && (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground/90">
                                    {summary.subtitle || 'Un parcours guidé, simple et tenable : respiration, intention du jour et carnet.'}
                                </div>

                                <ul className="grid gap-2 text-sm sm:grid-cols-2">
                                    <li className="rounded-xl border border-border bg-background p-3">
                                        <p className="font-medium">Tu y gagneras</p>
                                        <p className="mt-1 text-muted-foreground">Clarté, calme, constance — en ritualisant de courtes pratiques quotidiennes.</p>
                                    </li>
                                    <li className="rounded-xl border border-border bg-background p-3">
                                        <p className="font-medium">Méthode</p>
                                        <p className="mt-1 text-muted-foreground">Micro-sessions audio, intention écrite, et suivi de progression.</p>
                                    </li>
                                </ul>
                            </div>
                        )}

                        {tab === 'plan' && (
                            <div className="space-y-3">
                                {planLoading && <p className="text-sm text-muted-foreground">Chargement du plan…</p>}
                                {!planLoading && plan && plan.ok && plan.days.length > 0 ? (
                                    <ol className="grid gap-2">
                                        {plan.days.map((d) => {
                                            const isCurrent = d.index === summary.currentDay && summary.status !== 'completed';
                                            const href = `/learn/${summary.programSlug}/day/${pad2(d.index)}`;
                                            return (
                                                <li key={d.index}>
                                                    <Link
                                                        href={href}
                                                        onClick={() => setOpen(false)}
                                                        className={[
                                                            'block rounded-xl border px-3 py-2 text-sm transition',
                                                            isCurrent ? 'border-brand-300 bg-brand-50/70 text-brand-900' : 'border-border hover:bg-muted',
                                                        ].join(' ')}
                                                    >
                                                        <span className="font-medium">Jour {pad2(d.index)}</span>
                                                        {d.title ? <span className="ml-2 text-muted-foreground">— {d.title}</span> : null}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                ) : !planLoading && plan && !plan.ok ? (
                                    <p className="text-sm text-muted-foreground">{plan.error}</p>
                                ) : null}
                            </div>
                        )}
                    </>
                )}
            </FullscreenModal>
        </>
    );
}
