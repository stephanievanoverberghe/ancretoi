// components/program/sections/MethodMini.tsx
'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { HeartPulse, Wind, Timer, ArrowRight } from 'lucide-react';

/* ---------- Analytics ---------- */
type MethodEvent = 'program_detail_method_click';
type AnalyticsProps = Record<string, unknown>;
type PlausibleFn = (event: string, options?: { props?: AnalyticsProps }) => void;
type Posthog = { capture: (name: string, props?: AnalyticsProps) => void };

declare global {
    interface Window {
        plausible?: PlausibleFn;
        posthog?: Posthog;
    }
}

function track(event: MethodEvent, props?: AnalyticsProps) {
    if (typeof window === 'undefined') return;
    window.plausible?.(event, props ? { props } : undefined);
    window.posthog?.capture?.(event, props);
}

/* ---------- UI: icône “paper-cut” ---------- */
function PaperCutIcon({ Icon, title }: { Icon: LucideIcon; title: string }) {
    return (
        <div className="relative inline-grid h-12 w-12 place-items-center rounded-xl bg-white/90 ring-1 ring-white/70 shadow-[0_1px_0_rgba(0,0,0,0.03)] shrink-0">
            <span className="sr-only">{title}</span>
            <Icon className="absolute h-7 w-7 translate-x-[0.5px] translate-y-[0.5px] text-brand-700/25" strokeWidth={2.2} aria-hidden />
            <Icon className="relative h-7 w-7 text-brand-700/65" strokeWidth={1.9} aria-hidden />
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/40 via-transparent to-white/10" />
        </div>
    );
}

/* ---------- Types & mapping par programme ---------- */
type PillarId = 'corps' | 'souffle' | 'rituels';
type Pillar = { id: PillarId; title: string; desc: string; icon: LucideIcon; href: string };

function pillarsForSlug(slug: string): Pillar[] {
    const base: Omit<Pillar, 'desc'>[] = [
        { id: 'corps', title: 'Corps', icon: HeartPulse, href: '/methode#corps' },
        { id: 'souffle', title: 'Souffle', icon: Wind, href: '/methode#souffle' },
        { id: 'rituels', title: 'Rituels', icon: Timer, href: '/methode#rituels' },
    ];

    const s = slug.toLowerCase();
    let descs: Record<PillarId, string>;

    if (s.includes('reset-7')) {
        descs = {
            corps: 'Balayage corporel + micro-postures d’ancrage (2–3 min).',
            souffle: 'Respiration 4–6 (cohérence douce) pour apaiser & clarifier.',
            rituels: 'Intention du jour + mini journal guidé, tenable chaque jour.',
        };
    } else if (s.includes('boussole-10')) {
        descs = {
            corps: 'Ancrage express (posture + épaules) pour revenir au réel.',
            souffle: '4–6 avant chaque choix pour calmer & voir plus net.',
            rituels: 'Cap 10j + script OSBD courts : dire juste, en sécurité.',
        };
    } else if (s.includes('ancrage-30')) {
        descs = {
            corps: 'Routines d’ancrage progressives (scan, relâchement, mobilité).',
            souffle: 'Cohérence + expire long pour stabiliser le système.',
            rituels: 'Cadence matin • midi • soir (10–12 min/j) qui tient vraiment.',
        };
    } else if (s.includes('alchimie-90')) {
        descs = {
            corps: 'Progression douce (Acte I→III) : tonus, détente, présence.',
            souffle: '4–6 + box breathing 4-4-4-4 pour naviguer les phases.',
            rituels: 'Rituels d’intégration par actes, jalons hebdomadaires.',
        };
    } else {
        // fallback générique
        descs = {
            corps: 'On revient au ressenti : relâcher, ancrer, bouger juste.',
            souffle: 'Respiration guidée (cohérence) pour apaiser & éclaircir.',
            rituels: 'Routines courtes et régulières : constance > intensité.',
        };
    }

    return base.map((b) => ({ ...b, desc: descs[b.id] }));
}

/* ---------- Props ---------- */
type Props = {
    slug: string;
    title?: string;
    subtitle?: string;
    /** permet de surcharger les 3 piliers si besoin */
    pillarsOverride?: Pillar[];
};

export default function MethodMini({ slug, title = 'Pourquoi ça marche', subtitle = 'Une mini-méthode claire et tenable, alignée avec notre approche.', pillarsOverride }: Props) {
    const pillars = pillarsOverride ?? pillarsForSlug(slug);

    return (
        <section id="method-mini" aria-labelledby="method-mini-title" className="relative mx-[calc(50%-50vw)] z-10 w-screen overflow-hidden scroll-mt-24 py-12 sm:py-16 md:py-24">
            {/* halos + filets or */}
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
                <div className="absolute left-[-10%] top-[-12%] h-40 w-40 rounded-full bg-brand-100/25 blur-3xl" />
                <div className="absolute right-[-8%] bottom-[-14%] h-48 w-48 rounded-full bg-gold-100/35 blur-3xl" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/60" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/60" />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                {/* Header */}
                <header className="mb-8 sm:mb-10 text-center">
                    <h2 id="method-mini-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        {title}
                    </h2>
                    {subtitle && <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">{subtitle}</p>}
                </header>

                {/* Cartes */}
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {pillars.map((p) => (
                        <li key={p.id}>
                            <article className="group relative h-full rounded-2xl border border-brand-100/60 bg-white/80 backdrop-blur-[2px] px-4 py-4 sm:px-5 sm:py-5 shadow-[0_1px_10px_rgb(0_0_0/0.05)] transition hover:bg-white hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                                <div className="flex items-start gap-4">
                                    <PaperCutIcon Icon={p.icon} title={p.title} />
                                    <div className="min-w-0">
                                        <h3 className="text-[15px] font-semibold text-foreground">{p.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>

                                        <div className="mt-3">
                                            <Link
                                                href={p.href}
                                                onClick={() => track('program_detail_method_click', { slug, pillar: p.id })}
                                                className="btn w-full sm:w-auto justify-center"
                                                aria-label={`Comprendre la méthode — ${p.title}`}
                                            >
                                                Comprendre la méthode
                                                <ArrowRight className="h-4 w-4" aria-hidden />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* filet or bas de carte */}
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/80" aria-hidden />
                            </article>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
