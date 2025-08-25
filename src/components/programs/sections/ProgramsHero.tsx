'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import { Clock3, Gauge, Sparkles } from 'lucide-react';

/* --------- Analytics types --------- */
type HeroEvent = 'programs_hero_view' | 'programs_hero_cta_click';
type AnalyticsProps = Record<string, unknown>;

type PlausibleFn = (event: string, options?: { props?: AnalyticsProps }) => void;
type Posthog = { capture: (name: string, props?: AnalyticsProps) => void };

declare global {
    interface Window {
        plausible?: PlausibleFn;
        posthog?: Posthog;
    }
}

/* --------- UI types --------- */
type Chip = { icon: 'time' | 'charge' | 'level'; label: string };

type Props = {
    title?: string;
    subtitle?: string;
    chips?: Chip[];
    heroSrc?: string;
};

export default function ProgramsHero({
    title = 'Des parcours courts pour revenir au corps, au souffle et à l’essentiel.',
    subtitle = 'Des rituels tenables (10–12 min/j) pensés pour apaiser, clarifier et ancrer sans forcer.',
    chips = [
        { icon: 'time', label: '7 / 10 / 30 / 90 jours' },
        { icon: 'charge', label: '10–35 min / jour' },
        { icon: 'level', label: 'Basique • Cible • Premium' },
    ],
    heroSrc = '/images/programs/hero-programs.webp',
}: Props) {
    const sectionRef = useRef<HTMLElement | null>(null);
    const viewedRef = useRef(false);

    const track = useCallback((name: HeroEvent, props?: AnalyticsProps) => {
        if (typeof window !== 'undefined') {
            window.plausible?.(name, props ? { props } : undefined);
            window.posthog?.capture(name, props);
        }
    }, []);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el || viewedRef.current) return;

        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (!viewedRef.current && e.isIntersecting && e.intersectionRatio >= 0.5) {
                        viewedRef.current = true;
                        track('programs_hero_view', { section: 'programs-hero' });
                        io.disconnect();
                    }
                }
            },
            { threshold: [0, 0.5, 1] }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [track]);

    const icon = (i: Chip['icon']) => {
        const cls = 'h-4 w-4';
        if (i === 'time') return <Clock3 className={cls} aria-hidden />;
        if (i === 'charge') return <Gauge className={cls} aria-hidden />;
        return <Sparkles className={cls} aria-hidden />;
    };

    return (
        <section
            ref={sectionRef}
            id="programs-hero"
            aria-labelledby="programs-hero-title"
            aria-describedby="programs-hero-desc"
            className="relative isolate mx-[calc(50%-50vw)] w-screen overflow-hidden min-h-[86svh] md:min-h-[88svh] flex items-center px-4 md:px-10"
        >
            {/* BACKGROUND full-bleed (image + voiles) */}
            <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden="true">
                <Image
                    src={heroSrc}
                    alt=""
                    fill
                    sizes="100vw"
                    priority={false}
                    className="object-cover object-[center_45%] opacity-90"
                    onError={() => {
                        if (process.env.NODE_ENV !== 'production') {
                            console.warn('Hero Programs image failed to load:', heroSrc);
                        }
                    }}
                />
                {/* Voiles adaptatifs pour lisibilité */}
                <div className="absolute inset-0 md:hidden bg-gradient-to-b from-white/92 via-white/78 to-white/28" />
                <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-white/90 via-white/70 to-transparent" />
                <div className="absolute inset-0 hidden sm:block bg-brand-50/30 mix-blend-soft-light" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
            </div>

            {/* HALO conique doux */}
            <div
                className="pointer-events-none absolute -z-10 left-[-12vmin] top-1/2 -translate-y-1/2 w-[70vmin] h-[70vmin] sm:w-[84vmin] sm:h-[84vmin] md:w-[90vmin] md:h-[90vmin] blur-[8px] md:blur-[14px] mix-blend-soft-light opacity-30"
                aria-hidden="true"
                style={{
                    background:
                        'conic-gradient(from 0deg at 35% 50%, rgba(129,95,178,0.16) 0deg, rgba(255,214,140,0.10) 40deg, rgba(129,95,178,0.16) 80deg, transparent 120deg, transparent 180deg, rgba(129,95,178,0.14) 220deg, rgba(255,214,140,0.08) 260deg, rgba(129,95,178,0.14) 300deg, transparent 340deg)',
                    maskImage: 'radial-gradient(closest-side at 38% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.0) 75%)',
                    WebkitMaskImage: 'radial-gradient(closest-side at 38% 50%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.0) 75%)',
                }}
            />

            {/* fine ligne or en bas */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gold-200" aria-hidden="true" />

            {/* CONTENU */}
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 py-10 sm:py-14 lg:py-16">
                <div className="relative max-w-[44rem] text-center md:text-left">
                    {/* halo lisibilité */}
                    <div className="pointer-events-none absolute -inset-4 sm:-inset-6 -z-10 rounded-3xl bg-white/45 sm:bg-white/30 backdrop-blur-[2px] sm:backdrop-blur-[1.5px] ring-1 ring-white/50 sm:ring-white/40" />
                    <h1 id="programs-hero-title" className="font-serif text-[clamp(1.7rem,6.2vw,2.5rem)] md:text-[clamp(2.2rem,3.6vw,3.25rem)] leading-tight tracking-tight">
                        {title}
                    </h1>
                    <p id="programs-hero-desc" className="mt-3 sm:mt-4 text-[15px] sm:text-base md:text-lg leading-relaxed text-muted-foreground">
                        {subtitle}
                    </p>

                    <ul className="mt-5 flex flex-wrap justify-center md:justify-start gap-2">
                        {chips.map((c) => (
                            <li
                                key={c.label}
                                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-background/70 px-3 py-1 text-xs font-medium text-foreground backdrop-blur"
                            >
                                {icon(c.icon)}
                                <span>{c.label}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Link
                            href="#grid"
                            onClick={() => track('programs_hero_cta_click', { target: 'choose_program' })}
                            className="btn w-full sm:w-auto justify-center"
                            aria-label="Choisir mon programme"
                        >
                            Choisir mon programme
                        </Link>
                        <Link
                            href="/methode"
                            onClick={() => track('programs_hero_cta_click', { target: 'understand_method' })}
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-secondary-600 px-4 py-3.5 text-white text-[15px] sm:text-sm transition-colors hover:bg-secondary-700"
                            aria-label="Comprendre la méthode"
                        >
                            Comprendre la méthode
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
