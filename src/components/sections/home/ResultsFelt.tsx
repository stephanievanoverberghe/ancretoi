'use client';

import { useCallback, useEffect, useRef } from 'react';

declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
        posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
    }
}

type Props = {
    items?: string[];
    nextSectionId?: string;
};

export default function ResultsFelt({
    items = [
        'Plus de clarté au quotidien',
        'Rituels courts qui tiennent',
        'Présence & confiance retrouvées',
        'Limites posées sans culpabilité',
        'Énergie plus stable',
        'Anxiété apaisée',
        'Cap réaliste à 30 jours',
        'Sommeil & souffle améliorés',
    ],
    nextSectionId = 'how-it-works',
}: Props) {
    const sectionRef = useRef<HTMLElement>(null);

    const track = useCallback((name: string, props?: Record<string, unknown>) => {
        if (typeof window === 'undefined') return;
        window.plausible?.(name, props ? { props } : undefined);
        window.posthog?.capture?.(name, props);
    }, []);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        // Impression (50% visible)
        let viewed = false;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !viewed) {
                    viewed = true;
                    track('results_view');
                }
            },
            { threshold: 0.5 }
        );
        io.observe(el);

        // Scroll vers la section suivante
        let ioNext: IntersectionObserver | null = null;
        const next = document.getElementById(nextSectionId);
        if (next) {
            ioNext = new IntersectionObserver(
                ([e]) => {
                    if (e.isIntersecting) {
                        track('results_scroll_next', { to: nextSectionId });
                        ioNext?.disconnect();
                    }
                },
                { threshold: 0.3 }
            );
            ioNext.observe(next);
        }

        return () => {
            io.disconnect();
            ioNext?.disconnect();
        };
    }, [track, nextSectionId]);

    return (
        <section ref={sectionRef} id="results" aria-labelledby="results-title" className="relative mx-[calc(50%-50vw)] w-screen bg-brand-50/30 py-16 sm:py-20 lg:py-24">
            {/* halos premium + filets or */}
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
                <div
                    className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-brand-100/35 blur-2xl
                  [mask-image:radial-gradient(closest-side,black,transparent)]"
                />
                <div
                    className="absolute right-[-6%] bottom-[-12%] h-72 w-72 rounded-full bg-gold-100/35 blur-[60px]
                  [mask-image:radial-gradient(closest-side,black,transparent)]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/40 mix-blend-soft-light" />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                {/* Eyebrow + titre équilibré */}
                <header className="mb-10 sm:mb-12 lg:mb-14 text-center">
                    <h2 id="results-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Résultats ressentis — clarté, présence, confiance
                    </h2>

                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">Des bénéfices concrets qui se perçoivent dans le corps et dans le quotidien.</p>
                </header>

                {/* Grille de cards */}
                <ul className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.slice(0, 8).map((text, i) => (
                        <li key={i} className="h-full">
                            <div className="h-full group flex items-start gap-3 rounded-2xl border border-brand-100/70 ring-1 ring-white/60 bg-white/80 backdrop-blur-[2px] px-4 py-4 sm:px-5 sm:py-5 shadow-[0_1px_10px_rgb(0_0_0/0.05)] transition hover:bg-white hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                                <span className="mt-[6px] inline-block h-2 w-2 shrink-0 rounded-full bg-gold-400 ring-1 ring-gold-200" aria-hidden="true" />
                                <p className="text-[15px] sm:text-base leading-relaxed text-brand-900">{text}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
