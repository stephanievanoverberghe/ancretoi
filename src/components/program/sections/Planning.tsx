// components/program/sections/Planning.tsx
'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Clock3, Gauge, CalendarDays, RotateCcw } from 'lucide-react';

import { track } from '@/lib/analytics.client';
import type { Program } from '@/lib/programs-index';

/* ---------------- UI atoms ---------------- */

function SectionShell({ children }: { children: React.ReactNode }) {
    return (
        <section id="planning" aria-labelledby="planning-title" className="relative mx-[calc(50%-50vw)] w-screen overflow-hidden bg-white scroll-mt-24 py-10 sm:py-14 md:py-20">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />
            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">{children}</div>
        </section>
    );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={[
                'relative overflow-hidden rounded-2xl border border-brand-100/70 bg-white/80 backdrop-blur-[2px] p-5 sm:p-7',
                'shadow-[0_1px_10px_rgb(0_0_0/0.05)]',
                className,
            ].join(' ')}
        >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/35 via-transparent to-white/10" />
            {children}
        </div>
    );
}

function PaperCutIcon({ children, title }: { children: React.ReactNode; title: string }) {
    return (
        <span className="relative inline-grid h-10 w-10 place-items-center rounded-xl bg-white/90 ring-1 ring-white/70 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <span className="sr-only">{title}</span>
            <span className="absolute translate-x-[0.5px] translate-y-[0.5px] opacity-25">{children}</span>
            <span className="relative">{children}</span>
            <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/40 via-transparent to-white/10" />
        </span>
    );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <PaperCutIcon title={label}>{icon}</PaperCutIcon>
            <div className="min-w-0">
                <div className="text-[13px] text-secondary-700">{label}</div>
                <div className="text-sm font-semibold text-foreground">{value}</div>
            </div>
        </div>
    );
}

/* ---------------- helpers (DB-only) ---------------- */

// Fallback charge à partir du niveau si pas d’étiquette fournie
function levelToCharge(level?: string | null): string {
    if (level === 'Cible') return '20–40 min/j';
    if (level === 'Premium') return '40–60 min/j';
    // Basique ou inconnu
    return '10–20 min/j';
}

// Extrait la borne haute (ex. "10–20 min/j" -> 20)
function maxMinutesFromLabel(label: string): number | null {
    const nums = label.match(/\d+(?:[.,]\d+)?/g);
    if (!nums || nums.length === 0) return null;
    const last = Number((nums.at(-1) ?? '').replace(',', '.'));
    return Number.isFinite(last) ? Math.round(last) : null;
}

/* ---------------- Component ---------------- */

type Props = {
    program: Program;
    /** étiquette “charge/jour” injectée depuis la BDD (ex. "20–40 min/j") */
    dailyLoadLabel?: string;
    /** texture optionnelle derrière la carte */
    bgImageSrc?: string;
};

export default function Planning({ program, dailyLoadLabel, bgImageSrc = '/images/texture-soft.webp' }: Props) {
    const sectionRef = useRef<HTMLElement | null>(null);

    // KPI on view (analytics)
    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    track('program_detail_planning_view', { slug: program.slug });
                }
            },
            { threshold: 0.5 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [program.slug]);

    // Valeurs à afficher (100% BDD)
    const duration = `${program.duration_days} jours`;

    // Priorité: label injecté depuis la page serveur -> sinon mapping par niveau -> sinon défaut
    const charge = dailyLoadLabel ?? levelToCharge(program.level) ?? '10–20 min/j';

    const modulable = 'Oui — matin • midi • soir';
    const catchupMax = maxMinutesFromLabel(charge) ?? 20;
    const rattrapage = `Rattrapage simple (≤ ${catchupMax} min)`;

    // libellé minutes pour les vignettes (retire “/j” si présent)
    const minuteLabel = charge.replace(/\s*\/j\b/i, '');

    // Semaine type
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const activeIdx = new Set([0, 1, 2, 3, 4]); // Lun→Ven
    const catchupIdx = 6; // Dim

    return (
        <SectionShell>
            <section ref={sectionRef} className="mx-auto max-w-6xl">
                {/* Carte principale (glass + texture) */}
                <GlassCard className="z-10">
                    <Image
                        src={bgImageSrc}
                        alt=""
                        fill
                        sizes="100vw"
                        priority={false}
                        aria-hidden
                        className="pointer-events-none select-none absolute inset-0 -z-10 object-cover opacity-[0.28] mix-blend-multiply"
                    />
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-white/35" aria-hidden />

                    {/* Header */}
                    <header className="mb-6 sm:mb-8 text-center">
                        <h2 id="planning-title" className="font-serif text-[clamp(1.35rem,4.2vw,2rem)] leading-tight">
                            Planning & charge / jour
                        </h2>
                        <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">Pensé pour la vraie vie : sessions courtes, modulables, et faciles à rattraper.</p>
                    </header>

                    {/* KPIs — mobile-first: 2x2, puis 4 colonnes */}
                    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <li>
                            <KPI icon={<Clock3 className="h-6 w-6 text-brand-700/70" aria-hidden />} label="Durée totale" value={duration} />
                        </li>
                        <li>
                            <KPI icon={<Gauge className="h-6 w-6 text-brand-700/70" aria-hidden />} label="Charge / jour" value={charge} />
                        </li>
                        <li>
                            <KPI icon={<CalendarDays className="h-6 w-6 text-brand-700/70" aria-hidden />} label="Jours modulables" value={modulable} />
                        </li>
                        <li>
                            <KPI icon={<RotateCcw className="h-6 w-6 text-brand-700/70" aria-hidden />} label="Rattrapage" value={rattrapage} />
                        </li>
                    </ul>

                    {/* Agenda — mobile-first: timeline; desktop: grille 7 colonnes */}
                    <div className="mt-6 sm:mt-8">
                        <div className="mb-2 text-sm font-semibold text-foreground">Exemple d’agenda</div>

                        {/* MOBILE: timeline verticale */}
                        <div className="relative sm:hidden">
                            <div className="absolute left-3 top-0 bottom-0 w-px bg-gold-100/70" aria-hidden />
                            <ol className="space-y-2">
                                {days.map((d, i) => {
                                    const isActive = activeIdx.has(i);
                                    const isCatchup = i === catchupIdx;
                                    return (
                                        <li key={d} className="relative pl-6">
                                            {/* point sur le rail */}
                                            <span
                                                className={[
                                                    'absolute left-2 top-4 h-2.5 w-2.5 rounded-full ring-2',
                                                    isCatchup ? 'bg-gold-400 ring-gold-100/80' : isActive ? 'bg-brand-500 ring-brand-100/80' : 'bg-brand-200 ring-brand-100/70',
                                                ].join(' ')}
                                                aria-hidden
                                            />
                                            <div
                                                className={[
                                                    'rounded-xl border p-3',
                                                    isActive
                                                        ? 'bg-brand-50/80 border-brand-100/80'
                                                        : isCatchup
                                                        ? 'bg-gold-50/80 border-gold-200'
                                                        : 'bg-white/75 border-brand-100/60',
                                                ].join(' ')}
                                                aria-label={`${d}: ${isActive ? 'session courte' : isCatchup ? 'rattrapage possible' : 'libre'}`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="text-xs font-semibold text-secondary-900">{d}</div>
                                                    <div className="text-[11px] text-muted-foreground">{isActive ? `≈ ${minuteLabel}` : isCatchup ? 'rattrapage' : 'libre'}</div>
                                                </div>

                                                {/* micro-bar */}
                                                <div className="mt-2 h-1.5 w-full rounded-full bg-brand-50 ring-1 ring-brand-100/60">
                                                    <div
                                                        className={[
                                                            'h-full rounded-full transition-[width]',
                                                            isCatchup
                                                                ? 'bg-gradient-to-r from-gold-300 via-gold-500 to-gold-400'
                                                                : 'bg-gradient-to-r from-brand-300 via-brand-500 to-gold-400',
                                                        ].join(' ')}
                                                        style={{ width: isCatchup ? '80%' : isActive ? '55%' : '10%' }}
                                                        aria-hidden
                                                    />
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>

                        {/* DESKTOP: grille 7 colonnes */}
                        <ol className="hidden sm:grid sm:grid-cols-7 sm:gap-2">
                            {days.map((d, i) => {
                                const isActive = activeIdx.has(i);
                                const isCatchup = i === catchupIdx;

                                return (
                                    <li key={d}>
                                        <div
                                            className={[
                                                'rounded-xl border p-3 text-center',
                                                isActive ? 'bg-brand-50/70 border-brand-100/80' : isCatchup ? 'bg-gold-50/70 border-gold-200' : 'bg-white/70 border-brand-100/60',
                                            ].join(' ')}
                                            aria-label={`${d}: ${isActive ? 'session courte' : isCatchup ? 'rattrapage possible' : 'libre'}`}
                                        >
                                            <div className="text-xs font-semibold text-secondary-900">{d}</div>
                                            <div className="mt-2 h-1.5 w-full rounded-full bg-brand-50 ring-1 ring-brand-100/60">
                                                <div
                                                    className={[
                                                        'h-full rounded-full transition-[width]',
                                                        isCatchup
                                                            ? 'bg-gradient-to-r from-gold-300 via-gold-500 to-gold-400'
                                                            : 'bg-gradient-to-r from-brand-300 via-brand-500 to-gold-400',
                                                    ].join(' ')}
                                                    style={{ width: isCatchup ? '80%' : isActive ? '55%' : '10%' }}
                                                    aria-hidden
                                                />
                                            </div>
                                            <div className="mt-2 text-[11px] text-muted-foreground">{isActive ? `≈ ${minuteLabel}` : isCatchup ? 'rattrapage' : 'libre'}</div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>

                        {/* Légende simple */}
                        <div className="mt-3 flex items-center gap-3 text-[12px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full bg-brand-400" /> session
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full bg-gold-400" /> rattrapage
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full bg-brand-200" /> libre
                            </span>
                        </div>

                        <p className="mt-3 text-[12px] text-muted-foreground">
                            Tu peux déplacer Matin / Midi / Soir selon tes journées. Le dimanche peut servir de rattrapage si besoin.
                        </p>
                    </div>
                </GlassCard>
            </section>
        </SectionShell>
    );
}
