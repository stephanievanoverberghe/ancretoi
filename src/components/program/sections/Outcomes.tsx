// components/program/sections/Outcomes.tsx
'use client';

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { Frown, CheckCircle2, ArrowRight, Compass, Zap, HeartPulse, ShieldCheck, Timer, MoonStar, Target } from 'lucide-react';

import type { Program } from '@/lib/programs-index';
import { track } from '@/lib/analytics';

/* ---------------- UI atoms ---------------- */

function SectionShell({ children }: { children: React.ReactNode }) {
    return (
        <section id="outcomes" aria-labelledby="outcomes-title" className="relative mx-[calc(50%-50vw)] z-10 w-screen overflow-hidden scroll-mt-24 py-12 sm:py-16 md:py-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />
            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">{children}</div>
        </section>
    );
}

function PaperCutIcon({ Icon, title, className = '' }: { Icon: LucideIcon; title: string; className?: string }) {
    return (
        <span className={['relative inline-grid h-10 w-10 place-items-center rounded-xl bg-white/90 ring-1 ring-white/70 shadow-[0_1px_0_rgba(0,0,0,0.03)]', className].join(' ')}>
            <span className="sr-only">{title}</span>
            <Icon className="absolute h-6 w-6 translate-x-[0.5px] translate-y-[0.5px] text-brand-700/25" strokeWidth={2.2} aria-hidden />
            <Icon className="relative h-6 w-6 text-brand-700/70" strokeWidth={1.9} aria-hidden />
            <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/40 via-transparent to-white/10" />
        </span>
    );
}

function MiniCard({ children, accent = 'left' }: { children: React.ReactNode; accent?: 'left' | 'right' }) {
    return (
        <div
            className={[
                'relative rounded-xl border bg-white/80 backdrop-blur-[2px] p-3 sm:p-4',
                'shadow-[0_1px_10px_rgb(0_0_0/0.05)] ring-1 ring-brand-100/60',
                accent === 'left' ? 'from-brand-50/30' : 'from-gold-50/30',
            ].join(' ')}
        >
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/35 via-transparent to-white/10" />
            {children}
        </div>
    );
}

/* ---------------- Helpers ---------------- */

function lowerFirst(str: string) {
    return str.length ? str[0].toLowerCase() + str.slice(1) : str;
}

/** Essaie de générer une version “avant” douce à partir d’un résultat “après” */
function deriveBefore(after: string): string {
    const s = after.toLowerCase();

    if (/clarit|cap|boussole|direction/.test(s)) return 'Flou sur le cap';
    if (/énergie|energie|vitalit/.test(s)) return 'Énergie en dents de scie';
    if (/stress|anxi|tension/.test(s)) return 'Stress fréquent';
    if (/limite|boundary|cadre/.test(s)) return 'Limites diffuses';
    if (/rituel|routine|habitude/.test(s)) return 'Routines irrégulières';
    if (/sommeil|nuit|endorm/.test(s)) return 'Sommeil irrégulier';
    if (/concentr|focus|attention/.test(s)) return 'Concentration dispersée';

    return `Pas encore ${lowerFirst(after.replace(/[.。!?…]\s*$/u, '')).replace(/^de\s+/, '')}`;
}

/** Détecte un pictogramme selon le texte “après” */
type PictoId = 'clarity' | 'energy' | 'stress' | 'limits' | 'rituals' | 'sleep' | 'focus' | 'default';
function pickPictoId(text: string): PictoId {
    const s = text.toLowerCase();
    if (/clarit|cap|boussole|direction/.test(s)) return 'clarity';
    if (/énergie|energie|vitalit/.test(s)) return 'energy';
    if (/stress|anxi|tension/.test(s)) return 'stress';
    if (/limite|boundary|cadre/.test(s)) return 'limits';
    if (/rituel|routine|habitude/.test(s)) return 'rituals';
    if (/sommeil|nuit|endorm/.test(s)) return 'sleep';
    if (/concentr|focus|attention/.test(s)) return 'focus';
    return 'default';
}

const PICTOS: Record<PictoId, LucideIcon> = {
    clarity: Compass,
    energy: Zap,
    stress: HeartPulse,
    limits: ShieldCheck,
    rituals: Timer,
    sleep: MoonStar,
    focus: Target,
    default: Compass,
};

/* ---------------- Component ---------------- */

type Props = {
    program: Program; // on lit program.detail.outcomes
    bgImageSrc?: string; // texture optionnelle
};

export default function Outcomes({ program, bgImageSrc = '/images/texture-soft.webp' }: Props) {
    const ref = useRef<HTMLElement | null>(null);

    // KPI on view (une seule fois)
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let seen = false;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    track('program_detail_outcomes_view', { slug: program.slug });
                }
            },
            { threshold: 0.5 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [program.slug]);

    // 3–5 résultats “après”
    const afterList = useMemo(() => {
        const raw = program.detail?.outcomes ?? [];
        return raw
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 5);
    }, [program.detail?.outcomes]);

    // Permettre un override “avant” si présent dans le meta sans utiliser any
    type DetailWithBefore = { before_outcomes?: string[] };
    const beforeOverride = (program.detail as DetailWithBefore | undefined)?.before_outcomes;

    const beforeList = useMemo(() => {
        if (beforeOverride && beforeOverride.length) {
            return beforeOverride.map((s) => s.trim()).slice(0, afterList.length);
        }
        return afterList.map(deriveBefore);
    }, [afterList, beforeOverride]);

    // on zippe avant/après + picto
    const pairs = useMemo(
        () =>
            afterList.map((after, i) => ({
                after,
                before: beforeList[i] ?? deriveBefore(after),
                picto: pickPictoId(after),
            })),
        [afterList, beforeList]
    );

    if (afterList.length === 0) return null;

    return (
        <SectionShell>
            <section ref={ref} className="mx-auto max-w-6xl">
                {/* carte texture */}
                <div className="relative overflow-hidden rounded-2xl border border-brand-100/70 bg-white/85 backdrop-blur-[2px] p-6 sm:p-8 shadow-[0_1px_10px_rgb(0_0_0/0.05)]">
                    <Image
                        src={bgImageSrc}
                        alt=""
                        fill
                        sizes="100vw"
                        priority={false}
                        aria-hidden
                        className="pointer-events-none select-none absolute inset-0 -z-10 object-cover opacity-[0.30] mix-blend-multiply"
                    />
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-white/50" aria-hidden />

                    {/* Header */}
                    <header className="mb-6 sm:mb-8 text-center">
                        <h2 id="outcomes-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                            Résultats attendus (soft)
                        </h2>
                        <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">Des effets concrets et tenables quand tu pratiques régulièrement.</p>
                    </header>

                    {/* Rows avant → après */}
                    <ul className="grid gap-4 sm:gap-5">
                        {pairs.map((p, i) => {
                            const Icon = PICTOS[p.picto];
                            return (
                                <li key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-stretch">
                                    {/* Avant */}
                                    <MiniCard accent="left">
                                        <div className="flex items-start gap-3">
                                            <PaperCutIcon Icon={Icon} title="Thème" />
                                            <div className="min-w-0">
                                                <div className="inline-flex items-center gap-2">
                                                    <Frown className="h-3.5 w-3.5 text-secondary-700" aria-hidden />
                                                    <span className="text-[13px] font-semibold text-secondary-800">Avant</span>
                                                </div>
                                                <p className="mt-1 text-sm text-secondary-800">{p.before}</p>
                                            </div>
                                        </div>
                                    </MiniCard>

                                    {/* Separator (arrow) */}
                                    <div className="hidden sm:flex items-center justify-center">
                                        <ArrowRight className="h-5 w-5 text-gold-700/80" aria-hidden />
                                    </div>

                                    {/* Après */}
                                    <MiniCard accent="right">
                                        <div className="flex items-start gap-3">
                                            <PaperCutIcon Icon={Icon} title="Thème" />
                                            <div className="min-w-0">
                                                <div className="inline-flex items-center gap-2">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-gold-700" aria-hidden />
                                                    <span className="text-[13px] font-semibold text-foreground">Après</span>
                                                </div>
                                                <p className="mt-1 text-sm text-foreground">{p.after}</p>
                                            </div>
                                        </div>
                                    </MiniCard>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Disclaimer */}
                    <p className="mt-6 text-[13px] text-muted-foreground/90 text-center">
                        Ces résultats sont des tendances observées chez nos participantes et dépendent de ta régularité et de ton contexte. Ce n’est pas une promesse médicale.
                    </p>
                </div>
            </section>
        </SectionShell>
    );
}
