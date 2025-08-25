'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
        posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
    }
}

type Props = {
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    bgImageSrc?: string;
};

export default function FinalCTA({
    title = 'Ancre-toi aujourd’hui',
    subtitle = 'Un pas simple, tenable, apaisant — et tu t’en remercieras.',
    ctaLabel = 'Commencer maintenant',
    ctaHref = '/programs',
    bgImageSrc = '/images/cta-halo.webp',
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
        let seen = false;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting && !seen) {
                    seen = true;
                    track('finalcta_view');
                }
            },
            { threshold: 0.5 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [track]);

    const onClick = () => track('finalcta_click');

    return (
        <section ref={sectionRef} id="cta-final" aria-labelledby="cta-final-title" className="relative mx-[calc(50%-50vw)] w-screen overflow-hidden text-white">
            {/* BACKDROP : image + teinte améthyste + léger halo */}
            <div className="absolute inset-0 -z-10">
                <Image src={bgImageSrc} alt="" fill sizes="100vw" className="object-cover opacity-80" priority={false} />
                {/* teinte améthyste */}
                <div className="absolute inset-0 bg-brand-700/55" aria-hidden />
                {/* aurora subtile */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(60% 45% at 20% -10%, rgba(173,145,211,0.35), transparent 60%), radial-gradient(50% 35% at 85% 0%, rgba(246,225,173,0.22), transparent 55%)',
                    }}
                    aria-hidden
                />
            </div>

            {/* trait or discret en bas */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />

            {/* CONTENU */}
            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-14 sm:py-16 lg:py-20">
                <header className="text-center">
                    <h2 id="cta-final-title" className="font-serif text-[clamp(1.6rem,4.6vw,2.2rem)] leading-tight tracking-tight">
                        {title}
                    </h2>
                    {subtitle && <p className="mt-3 text-[15px] sm:text-base text-white/90">{subtitle}</p>}
                </header>

                {/* CTA avec glow doré + micro-interaction */}
                <div className="mt-7 flex justify-center">
                    <Link href={ctaHref} onClick={onClick} className="group relative inline-flex items-center" aria-label={ctaLabel}>
                        {/* glow doré doux (sous le bouton) */}
                        <span className="absolute -inset-x-4 -inset-y-2 rounded-2xl bg-gradient-to-r from-gold-200/30 via-gold-300/35 to-gold-200/30 blur-xl opacity-60 transition-opacity group-hover:opacity-80" />
                        {/* bouton */}
                        <span className="relative inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-[15px] font-medium text-brand-700 shadow-md ring-1 ring-white/60 transition-transform duration-150 hover:scale-[1.02] active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                            {ctaLabel}
                            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="ml-2 transition-transform duration-150 group-hover:translate-x-0.5">
                                <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
