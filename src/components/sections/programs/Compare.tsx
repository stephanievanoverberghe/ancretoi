'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import compare from '@/data/programs/compare.json';
import { Info, Target, Clock3, Gauge, Sparkles, ArrowRight, ChevronDown } from 'lucide-react';

/* ---------- Analytics (typage strict) ---------- */
type CompareEvent = 'programs_compare_expand' | 'programs_compare_cta';
type AnalyticsProps = Record<string, unknown>;
type PlausibleFn = (event: string, options?: { props?: AnalyticsProps }) => void;
type Posthog = { capture: (name: string, props?: AnalyticsProps) => void };

declare global {
    interface Window {
        plausible?: PlausibleFn;
        posthog?: Posthog;
    }
}

function track(event: CompareEvent, props?: AnalyticsProps) {
    if (typeof window === 'undefined') return;
    if (props) window.plausible?.(event, { props });
    else window.plausible?.(event);
    window.posthog?.capture(event, props);
}

/* ---------- Types JSON ---------- */
type CompareRow = {
    slug: 'reset-7' | 'boussole-10' | 'ancrage-30' | 'alchimie-90' | (string & {});
    objectif: string;
    duree: string; // "7 jours"
    charge: string; // "10–15 min/j"
    niveau: 'Basique' | 'Cible' | 'Premium' | (string & {});
    ideal_si: string;
    cta: string; // "Voir RESET-7"
};
type CompareFile = { rows: CompareRow[] };

const TITLE_BY_SLUG: Record<string, string> = {
    'reset-7': 'RESET-7',
    'boussole-10': 'BOUSSOLE-10',
    'ancrage-30': 'ANCRAGE-30',
    'alchimie-90': 'ALCHIMIE-90',
};

export default function ProgramsCompare() {
    const sectionRef = useRef<HTMLElement | null>(null);
    const sent = useRef(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el || sent.current) return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting && e.intersectionRatio >= 0.5 && !sent.current) {
                        sent.current = true;
                        track('programs_compare_expand', { section: 'compare' });
                        io.disconnect();
                    }
                }
            },
            { threshold: [0, 0.5, 1] }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const items = useMemo<CompareRow[]>(() => (compare as CompareFile).rows, []);

    return (
        <section ref={sectionRef} id="compare" aria-labelledby="compare-title" className="relative mx-[calc(50%-50vw)] w-screen overflow-hidden bg-brand-50/25 py-14 sm:py-18">
            {/* filets or très subtils */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-200/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-200/70 to-transparent" />

            {/* halo doux */}
            <div
                aria-hidden
                className="pointer-events-none absolute -left-24 top-1/2 -translate-y-1/2 h-[80vmin] w-[80vmin] rounded-full blur-[28px] opacity-30"
                style={{ background: 'radial-gradient(closest-side, rgba(199,178,225,0.35), rgba(199,178,225,0.18) 45%, rgba(0,0,0,0) 70%)' }}
            />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {/* Header éditorial premium */}
                <header className="mb-6 sm:mb-8 flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-white/70 ring-1 ring-gold-200 p-2 text-ormat shadow-sm">
                        <Info className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="relative">
                        <h2 id="compare-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                            Quel programme pour moi&nbsp;?
                        </h2>
                        <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">
                            Un coup d’œil sur l’<span className="font-medium">objectif</span>, la <span className="font-medium">durée</span>, la{' '}
                            <span className="font-medium">charge/jour</span> et le <span className="font-medium">niveau</span> — et tu choisis.
                        </p>
                    </div>
                </header>

                {/* Légende des niveaux (repliable) */}
                <details className="group mt-2 mb-5 rounded-xl border border-brand-100 bg-white/70 backdrop-blur p-3 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold">
                            <Sparkles className="h-4 w-4 text-ormat" aria-hidden />
                            Comprendre les niveaux
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                    </summary>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {/* Basique */}
                        <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-3">
                            <div className="mb-1 inline-flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-2 py-0.5 text-[11px] font-medium">Basique</span>
                                <span className="text-[11px] text-muted-foreground">≈ 10-20 min/j</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Pour <span className="font-medium">démarrer en douceur</span> : bases, prise en main, rituels très courts.
                            </p>
                        </div>

                        {/* Cible */}
                        <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-3">
                            <div className="mb-1 inline-flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-2 py-0.5 text-[11px] font-medium">Cible</span>
                                <span className="text-[11px] text-muted-foreground">≈ 20-40 min/j</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Pour <span className="font-medium">stabiliser & ancrer</span> : focus sur le rythme et l’axe, progression guidée.
                            </p>
                        </div>

                        {/* Premium */}
                        <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-3">
                            <div className="mb-1 inline-flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-2 py-0.5 text-[11px] font-medium">Premium</span>
                                <span className="text:[11px] text-muted-foreground">≈ 40-60 min/j</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Pour <span className="font-medium">approfondir & transformer</span> : introspection, jalons, vision long terme.
                            </p>
                        </div>
                    </div>
                </details>

                {/* Mobile : cartes empilées “glass” (même design) */}
                <ul className="grid gap-4 md:hidden" aria-label="Comparateur (version cartes)">
                    {items.map((r) => {
                        const title = TITLE_BY_SLUG[r.slug] ?? r.slug.toUpperCase();
                        return (
                            <li key={r.slug} className="relative rounded-2xl border border-brand-100/70 bg-white/70 backdrop-blur-[2px] shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                                {/* micro filet or */}
                                <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold-300/70 to-transparent" />
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-[15px] font-semibold">
                                            {title} <span className="text-muted-foreground">— {r.duree}</span>
                                        </h3>
                                        <span className="inline-flex items-center gap-1 rounded-full border border-gold-200 bg-gold-50 px-2 py-0.5 text-[11px] font-medium text-foreground">
                                            <Sparkles className="h-3.5 w-3.5" aria-hidden />
                                            {r.niveau}
                                        </span>
                                    </div>

                                    {/* Objectif */}
                                    <div className="mt-3 flex items-start gap-2 text-sm">
                                        <Target className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                                        <p className="text-muted-foreground">{r.objectif}</p>
                                    </div>

                                    {/* Méta : durée / charge */}
                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 className="h-3.5 w-3.5" aria-hidden />
                                            {r.duree}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Gauge className="h-3.5 w-3.5" aria-hidden />
                                            {r.charge}
                                        </span>
                                    </div>

                                    {/* Idéal si… */}
                                    <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50/40 p-3 text-sm">
                                        <span className="font-medium">Idéal si&nbsp;:</span> <span className="text-muted-foreground">{r.ideal_si}</span>
                                    </div>

                                    {/* CTA */}
                                    <div className="mt-4">
                                        <Link
                                            href={`/programs/${r.slug}`}
                                            onClick={() => track('programs_compare_cta', { slug: r.slug, source: 'mobile' })}
                                            className="btn"
                                            aria-label={r.cta}
                                        >
                                            {r.cta}
                                            <ArrowRight className="h-4 w-4" aria-hidden />
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {/* Desktop : tableau élégant (même design) */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                        <table className="min-w-[820px] w-full text-sm">
                            <colgroup>
                                <col className="w-[16%]" />
                                <col className="w-[28%]" />
                                <col className="w-[12%]" />
                                <col className="w-[16%]" />
                                <col className="w-[12%]" />
                                <col className="w-[26%]" />
                                <col className="w-[10%]" />
                            </colgroup>
                            <thead className="sticky top-0 z-10 bg-brand-100 backdrop-blur text-foreground shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold">
                                    <th scope="col">Programme</th>
                                    <th scope="col">Objectif</th>
                                    <th scope="col">Durée</th>
                                    <th scope="col">Charge/j</th>
                                    <th scope="col">Niveau</th>
                                    <th scope="col">Idéal si…</th>
                                    <th scope="col" className="text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-100">
                                {items.map((r, i) => {
                                    const title = TITLE_BY_SLUG[r.slug] ?? r.slug.toUpperCase();
                                    return (
                                        <tr key={r.slug} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-brand-50/20'} hover:bg-gold-50/40`}>
                                            <th scope="row" className="px-4 py-3 font-semibold text-foreground">
                                                {title}
                                            </th>
                                            <td className="px-4 py-3 text-muted-foreground">{r.objectif}</td>
                                            <td className="px-4 py-3">{r.duree}</td>
                                            <td className="px-4 py-3">{r.charge}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 rounded-full border border-gold-200 bg-gold-50 px-2 py-0.5 text-[11px] font-medium">
                                                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                                                    {r.niveau}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{r.ideal_si}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/programs/${r.slug}`}
                                                    onClick={() => track('programs_compare_cta', { slug: r.slug, source: 'desktop' })}
                                                    className="btn"
                                                    aria-label={r.cta}
                                                >
                                                    Voir
                                                    <ArrowRight className="h-4 w-4" aria-hidden />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Légende / réassurance courte */}
                    <p className="mt-3 text-xs text-muted-foreground">Les charges/jour sont indicatives pour t’aider à estimer l’engagement quotidien.</p>
                </div>
            </div>
        </section>
    );
}
