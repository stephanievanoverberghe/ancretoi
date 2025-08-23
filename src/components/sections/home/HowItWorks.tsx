'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';

declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
        posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
    }
}

type Step = { key: string; number: string; title: string; text: string };

type Props = {
    steps?: Step[];
    ctaHref?: string;
    nextSectionId?: string;
    isAuthed?: boolean;
};

export default function HowItWorks({
    steps = [
        { key: 'account', number: '01', title: 'Crée ton espace', text: 'Un compte sécurisé pour suivre tes programmes et ton journal.' },
        { key: 'choose', number: '02', title: 'Choisis un programme', text: 'RESET-7, BOUSSOLE-10, ANCRAGE-30 ou ALCHIMIE-90 selon ton rythme.' },
        { key: 'daily', number: '03', title: 'Un petit pas chaque jour', text: 'Audio + micro-exercice + intention. Simple, tenable, apaisant.' },
    ],
    ctaHref = '/register',
    nextSectionId = 'sample-day',
    isAuthed = false, // ✅ NEW
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

        // Impression section
        let seen = false;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    track('howitworks_view');
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
                        track('howitworks_scroll_next', { to: nextSectionId });
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

    const onCta = () => track('howitworks_cta_click');

    return (
        <section ref={sectionRef} id="how-it-works" aria-labelledby="how-title" className="relative mx-[calc(50%-50vw)] w-screen bg-white py-12 sm:py-16 lg:py-20">
            {/* filets or haut/bas */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/60" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/60" aria-hidden />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                {/* Titre */}
                <header className="mb-10 sm:mb-12 lg:mb-14 text-center">
                    <h2 id="how-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Comment ça marche — 3 étapes simples
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">
                        Crée ton espace, choisis un programme, avance un petit pas chaque jour (audio, micro-exercice, intention).
                    </p>
                </header>

                {/* Ligne de connexion (desktop) */}
                <div className="relative">
                    <div className="pointer-events-none absolute left-0 right-0 top-[1.25rem] hidden md:block" aria-hidden>
                        <div className="mx-auto max-w-5xl border-t border-secondary-200" />
                    </div>

                    {/* Steps */}
                    <ol className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
                        {steps.map((s, i) => (
                            <li key={s.key} className="h-full">
                                <article className="group h-full rounded-2xl border border-secondary-200 bg-white/80 backdrop-blur-[1.5px] shadow-[0_1px_8px_rgb(0_0_0/0.04)] transition hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgb(0_0_0/0.06)] px-4 py-5 sm:px-5">
                                    <div className="flex items-start gap-3 md:flex-col md:items-center md:text-center">
                                        <span
                                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-900 font-semibold ring-1 ring-gold-200 md:translate-y-[-14px]"
                                            aria-hidden="true"
                                        >
                                            {s.number}
                                        </span>
                                        <h3 className="mt-0.5 md:mt-2 font-serif text-base leading-snug text-brand-900">{s.title}</h3>
                                    </div>

                                    <p className="mt-3 text-[14px] leading-relaxed text-brand-900 md:text-center">{s.text}</p>
                                </article>

                                {/* Connecteur vertical (mobile) */}
                                {i < steps.length - 1 && <div className="mx-8 my-3 block h-px bg-secondary-200 md:hidden" aria-hidden />}
                            </li>
                        ))}
                    </ol>
                </div>

                {/* CTA principal — visible uniquement si NON connecté */}
                {!isAuthed && (
                    <div className="mt-10 sm:mt-12 text-center">
                        <Link href={ctaHref} onClick={onCta} className="btn" aria-label="Créer mon compte">
                            Créer mon compte
                        </Link>
                        <p className="mt-2 text-xs text-muted-foreground">Gratuit pour créer l’espace. Tu choisis ensuite le programme qui te convient.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
