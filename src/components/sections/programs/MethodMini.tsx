'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { HeartPulse, Wind, Timer, ArrowRight } from 'lucide-react';

/* ---------- Analytics ---------- */
type MethodEvent = 'programs_method_click';
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

    const plausible = window.plausible;
    if (plausible) {
        if (props) plausible(event, { props });
        else plausible(event);
    }

    if (window.posthog?.capture) {
        window.posthog.capture(event, props);
    }
}

/* ---------- UI: icône “paper-cut” ---------- */
function PaperCutIcon({ Icon, title }: { Icon: LucideIcon; title: string }) {
    return (
        <div className="relative inline-grid h-12 w-12 place-items-center rounded-xl bg-white/90 ring-1 ring-white/70 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <span className="sr-only">{title}</span>
            <Icon className="absolute h-7 w-7 translate-x-[0.5px] translate-y-[0.5px] text-brand-700/25" strokeWidth={2.2} aria-hidden />
            <Icon className="relative h-7 w-7 text-brand-700/65" strokeWidth={1.9} aria-hidden />
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/40 via-transparent to-white/10" />
        </div>
    );
}

/* ---------- Données ---------- */
type PillarId = 'corps' | 'souffle' | 'rituels';
type Pillar = { id: PillarId; title: string; desc: string; icon: LucideIcon; href: string };

const DEFAULT_PILLARS: Pillar[] = [
    {
        id: 'corps',
        title: 'Corps',
        desc: 'On revient au ressenti : relâcher, ancrer, bouger juste. Le corps comme repère simple & présent.',
        icon: HeartPulse,
        href: '/methode#corps',
    },
    {
        id: 'souffle',
        title: 'Souffle',
        desc: 'Respiration guidée (4–6, cohérence) pour apaiser le système et clarifier sans forcer.',
        icon: Wind,
        href: '/methode#souffle',
    },
    {
        id: 'rituels',
        title: 'Rituels (10–12 min/j)',
        desc: 'Des routines très courtes qui tiennent dans la vraie vie : constance douce > intensité ponctuelle.',
        icon: Timer,
        href: '/methode#rituels',
    },
];

/* ---------- Props ---------- */
type Props = {
    title?: string;
    subtitle?: string;
    pillars?: Pillar[];
};

export default function MethodMini({ title = 'Pourquoi ça marche', subtitle = 'Une méthode simple qui t’ancre au quotidien.', pillars = DEFAULT_PILLARS }: Props) {
    return (
        <section id="method-mini" aria-labelledby="method-mini-title" className="relative mx-[calc(50%-50vw)] w-screen overflow-hidden bg-brand-50/25 py-14 sm:py-18">
            {/* halo léger + filets or, comme sur Home */}
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
                            <article className="group relative h-full rounded-2xl border border-brand-100/60 bg-white/80 backdrop-blur-[2px] shadow-[0_1px_8px_rgb(0_0_0/0.04)] transition-transform duration-200 ease-out hover:-translate-y-0.5 p-5">
                                <div className="flex items-start gap-4">
                                    <PaperCutIcon Icon={p.icon} title={p.title} />
                                    <div className="min-w-0">
                                        <h3 className="text-[15px] font-semibold text-foreground">{p.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>

                                        <div className="mt-3">
                                            <Link
                                                href={p.href}
                                                onClick={() => track('programs_method_click', { pillar: p.id })}
                                                className="btn w-full sm:w-auto justify-center"
                                                aria-label={`Comprendre la méthode — ${p.title}`}
                                            >
                                                Comprendre la méthode
                                                <ArrowRight className="h-4 w-4" aria-hidden />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
