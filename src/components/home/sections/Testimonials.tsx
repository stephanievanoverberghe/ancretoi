'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
        posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
    }
}

type Testimonial = {
    name: string;
    before?: string;
    highlight: string;
    after?: string;
};

type Props = {
    title?: string;
    subtitle?: string;
    items?: Testimonial[];
    textureSrc?: string;
};

function initialFrom(name: string) {
    const s = (name || '').trim();
    return s ? s[0]!.toUpperCase() : '•';
}

export default function Testimonials({
    title = 'Témoignages vibrants',
    subtitle = 'Réassurance, authenticité, transformations réelles.',
    items = [], // ← vide par défaut : on affiche un “bientôt”
    textureSrc = '/images/texture-soft.webp',
}: Props) {
    const sectionRef = useRef<HTMLElement>(null);
    const hasTracked = useRef(false);

    const track = useCallback((name: string, props?: Record<string, unknown>) => {
        if (typeof window === 'undefined') return;
        window.plausible?.(name, props ? { props } : undefined);
        window.posthog?.capture?.(name, props);
    }, []);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !hasTracked.current) {
                    hasTracked.current = true;
                    track('testimonials_view');
                }
            },
            { threshold: 0.5 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [track]);

    return (
        <section ref={sectionRef} id="testimonials" aria-labelledby="testimonials-title" className="relative mx-[calc(50%-50vw)] w-screen bg-white py-16 sm:py-20 lg:py-24">
            {/* filets or haut/bas */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <header className="mb-10 sm:mb-12 lg:mb-14 text-center">
                    <h2 id="testimonials-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        {title}
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">{subtitle}</p>
                </header>

                {items.length === 0 ? (
                    // ÉTAT VIDE — “Bientôt”
                    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-secondary-200 bg-white/85 backdrop-blur-[2px] ring-1 ring-white/60 shadow-[0_8px_24px_rgb(0_0_0/0.06)] px-5 py-7 text-center">
                        {/* texture douce */}
                        <div
                            className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply"
                            style={{ backgroundImage: `url(${textureSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                            aria-hidden
                        />
                        <p className="relative mx-auto max-w-2xl text-[15px] sm:text-base text-secondary-800">
                            Les retours arrivent&nbsp;! Les premières cohortes partagent bientôt leurs vécus.
                            <br />
                            <span className="inline-block mt-2 rounded-full bg-gold-50 px-3 py-1 text-[13px] font-medium text-gold-900 ring-1 ring-gold-200">
                                Authenticité avant tout — pas de faux avis.
                            </span>
                        </p>
                    </div>
                ) : (
                    // LISTE DE TÉMOIGNAGES
                    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((t, i) => (
                            <li key={`${t.name}-${i}`}>
                                <article
                                    onClick={() => track('testimonial_interaction', { i, name: t.name })}
                                    className="group relative overflow-hidden rounded-2xl border border-secondary-200 bg-white/85 backdrop-blur-[2px] ring-1 ring-white/60 shadow-[0_1px_12px_rgb(0_0_0/0.06)] transition hover:-translate-y-[1px] hover:shadow-[0_10px_26px_rgb(0_0_0/0.07)] p-5"
                                >
                                    {/* texture subtile */}
                                    <div
                                        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
                                        style={{ backgroundImage: `url(${textureSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                        aria-hidden
                                    />

                                    <div className="relative flex items-start gap-3">
                                        {/* Avatar initiale */}
                                        <span
                                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-bold ring-2 ring-white shadow-sm"
                                            aria-hidden
                                        >
                                            {initialFrom(t.name)}
                                        </span>

                                        <div className="min-w-0">
                                            {/* Citation avec bénéfice en gras */}
                                            <p className="text-[15px] leading-relaxed text-brand-900">
                                                {t.before && <span>{t.before} </span>}
                                                <strong className="font-semibold">{t.highlight}</strong>
                                                {t.after && <span> {t.after}</span>}
                                            </p>

                                            {/* Signature */}
                                            <p className="mt-3 text-sm font-medium text-secondary-900">{t.name}</p>
                                        </div>
                                    </div>
                                </article>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
