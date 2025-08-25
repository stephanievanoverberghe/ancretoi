'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback } from 'react';

type Props = {
    onProgramsClickEvent?: () => void;
    onQuizClickEvent?: () => void;
};

export default function Hero({ onProgramsClickEvent, onQuizClickEvent }: Props) {
    const track = useCallback((name: string) => {
        if (typeof window !== 'undefined' && window.plausible) window.plausible(name);
        if (typeof window !== 'undefined' && window.posthog) window.posthog.capture(name);
    }, []);

    const onPrograms = () => {
        track('hero_cta_programs_click');
        onProgramsClickEvent?.();
    };
    const onQuiz = () => {
        track('hero_cta_quiz_click');
        onQuizClickEvent?.();
    };

    return (
        <section
            id="hero"
            aria-labelledby="hero-title"
            className="relative isolate mx-[calc(50%-50vw)] w-screen overflow-hidden min-h-[86svh] md:min-h-[88svh] flex items-center px-4 md:px-10"
        >
            {/* BACKGROUND full-bleed décoratif */}
            <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden="true">
                <Image src="/images/hero-amethyste.webp" alt="" aria-hidden="true" fill sizes="100vw" priority={false} className="object-cover" />
                {/* Voiles adaptatifs pour la lisibilité */}
                <div className="absolute inset-0 md:hidden bg-gradient-to-b from-white/95 via-white/80 to-white/30" />
                <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-white/90 via-white/70 to-transparent" />
                <div className="absolute inset-0 hidden sm:block bg-brand-50/30 mix-blend-soft-light" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
            </div>

            {/* HALO fixe */}
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
                    {/* halo lisibilité (carte d’air) */}
                    <div
                        className="pointer-events-none absolute -inset-4 sm:-inset-6 -z-10 rounded-3xl bg-white/45 sm:bg-white/30 backdrop-blur-[2px] sm:backdrop-blur-[1.5px] ring-1 ring-white/50 sm:ring-white/40"
                        aria-hidden="true"
                    />
                    <h1 id="hero-title" className="font-serif text-[clamp(1.7rem,6.2vw,2.5rem)] md:text-[clamp(2.2rem,3.6vw,3.25rem)] leading-tight tracking-tight">
                        Ancre-toi : des programmes guidés pour gagner en clarté et te transformer au quotidien
                    </h1>

                    <p className="mt-3 sm:mt-4 text-[15px] sm:text-base md:text-lg leading-relaxed text-muted-foreground">
                        Développement personnel pas à pas en audio, texte et vidéo — 7, 10, 30, 90 jours. Rituels courts qui tiennent, présence et confiance retrouvées. RESET-7,
                        BOUSSOLE-10, ANCRAGE-30, ALCHIMIE-90.
                    </p>

                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Link href="#programmes" onClick={onPrograms} className="btn w-full sm:w-auto justify-center" aria-label="Découvrir les programmes">
                            Voir les programmes guidés
                        </Link>
                        <Link
                            href="/quiz/boussole"
                            onClick={onQuiz}
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-secondary-600 px-4 py-3.5 text-white text-[15px] sm:text-sm transition-colors hover:bg-secondary-700"
                            aria-label="Faire le mini-quiz Boussole"
                        >
                            Passer le mini-quiz Boussole
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
