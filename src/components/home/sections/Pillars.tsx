'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useCallback } from 'react';

declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
        posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
    }
}

type Pillar = {
    key: 'ancrage' | 'boussole' | 'alchimie';
    title: string;
    text: string;
    img: { src: string; alt: string };
    number: string;
    href: string;
};

export default function Pillars() {
    const sectionRef = useRef<HTMLElement>(null);
    const dwellStart = useRef<number | null>(null);
    const dwellTotal = useRef<number>(0);
    const hasViewed = useRef(false);

    const track = useCallback((name: string, props?: Record<string, unknown>) => {
        if (typeof window === 'undefined') return;
        window.plausible?.(name, props ? { props } : undefined);
        window.posthog?.capture?.(name, props);
    }, []);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const onEnter = () => {
            if (!hasViewed.current) {
                hasViewed.current = true;
                track('pillars_view');
            }
            if (dwellStart.current == null) dwellStart.current = performance.now();
        };
        const onLeave = () => {
            if (dwellStart.current != null) {
                dwellTotal.current += performance.now() - dwellStart.current;
                dwellStart.current = null;
            }
        };

        const io = new IntersectionObserver(([e]) => (e.isIntersecting ? onEnter() : onLeave()), { threshold: 0.6 });
        io.observe(el);

        const onVisChange = () => (document.hidden ? onLeave() : onEnter());
        document.addEventListener('visibilitychange', onVisChange);

        return () => {
            io.disconnect();
            document.removeEventListener('visibilitychange', onVisChange);
            if (dwellStart.current != null) dwellTotal.current += performance.now() - dwellStart.current;
            const ms = Math.round(dwellTotal.current);
            if (ms > 250) track('pillars_dwell_ms', { ms });
        };
    }, [track]);

    const pillars: Pillar[] = [
        {
            key: 'ancrage',
            number: '01',
            title: 'Ancrage',
            text: 'Revenir au corps, poser des racines dans le quotidien. Apaiser le système pour décider depuis un lieu plus stable.',
            img: { src: '/images/method/pillar-ancrage.webp', alt: 'Silhouette racines/pieds stylisés en papier, sauge et lilas, lumière douce' },
            href: '/methode#ancrage',
        },
        {
            key: 'boussole',
            number: '02',
            title: 'Boussole',
            text: 'Clarifier ce qui compte vraiment. Choisir en clarté, poser des limites saines, avancer dans la bonne direction.',
            img: { src: '/images/method/pillar-boussole.webp', alt: 'Rose des vents minimaliste en papier, améthyste et or discret' },
            href: '/methode#boussole',
        },
        {
            key: 'alchimie',
            number: '03',
            title: 'Alchimie',
            text: 'Transformer avec douceur. Faire circuler, intégrer, transmuter pour créer un axe vivant et durable.',
            img: { src: '/images/method/pillar-alchimie.webp', alt: 'Spirale/flux en papier évoquant la transformation, améthyste vers or' },
            href: '/methode#alchimie',
        },
    ];

    const onCardClick = (key: string, position: number) => {
        track('pillar_click', { key, position });
    };

    return (
        <section ref={sectionRef} id="pillars" aria-labelledby="pillars-title" className="relative mx-[calc(50%-50vw)] w-screen bg-white py-12 sm:py-16 lg:py-20">
            {/* halos très légers */}
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
                <div className="absolute left-[-10%] top-[-12%] h-48 w-48 rounded-full bg-brand-100/25 blur-3xl" />
                <div className="absolute right-[-8%] bottom-[-14%] h-56 w-56 rounded-full bg-gold-100/35 blur-3xl" />
            </div>
            {/* filets or */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/60" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/60" />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <header className="mb-8 sm:mb-10 lg:mb-12 text-center">
                    <h2 id="pillars-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Méthode & Philosophie
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">
                        3 piliers qui structurent l’expérience : <span className="font-medium text-foreground">Ancrage</span>,{' '}
                        <span className="font-medium text-foreground">Boussole</span>, <span className="font-medium text-foreground">Alchimie</span>.
                    </p>
                </header>

                {/* Mobile: stack / Tablet: horizontales / Desktop: 3 colonnes verticales */}
                <ul className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-gold-100/60 items-stretch">
                    {pillars.map((p, i) => (
                        <li key={p.key} className="lg:px-5">
                            <Link
                                href={p.href}
                                onClick={() => onCardClick(p.key, i + 1)}
                                className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 h-full"
                                aria-label={`Découvrir le pilier ${p.title}`}
                            >
                                <article className="group h-full flex flex-col md:flex-row lg:flex-col rounded-2xl border border-brand-100/60 bg-white/80 backdrop-blur-[2px] shadow-[0_1px_8px_rgb(0_0_0/0.04)] transition-transform duration-200 ease-out hover:-translate-y-0.5 px-3.5 pt-3.5 pb-4 md:p-4 min-h-[22rem] sm:min-h-[23rem] md:min-h-[13rem] lg:min-h-[22rem]">
                                    {/* Image */}
                                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl md:rounded-l-xl md:rounded-r-none md:w-[42%] lg:w-full lg:rounded-xl shrink-0">
                                        <Image src={p.img.src} alt={p.img.alt} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
                                        <div className="absolute left-3 top-3 flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-800 ring-1 ring-brand-100">
                                                {p.number}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-brand-50/70 px-2 py-0.5 text-[10px] font-medium text-brand-900 ring-1 ring-brand-100">
                                                {p.title}
                                            </span>
                                        </div>
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent" />
                                    </div>

                                    {/* Contenu */}
                                    <div className="mt-3 md:mt-0 md:pl-4 lg:pl-0 lg:mt-3 flex flex-col md:justify-center flex-1">
                                        <h3 className="font-serif text-base md:text-[1.05rem] leading-snug">{p.title}</h3>
                                        <p
                                            className="mt-1.5 text-[14px] leading-relaxed text-brand-900"
                                            style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {p.text}
                                        </p>

                                        <div className="mt-auto pt-3 inline-flex items-center gap-2 text-[13px] font-medium text-brand-700">
                                            <span>Découvrir</span>
                                            <span
                                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-100 transition-transform group-hover:translate-x-0.5"
                                                aria-hidden
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-90">
                                                    <path
                                                        d="M13 5l7 7-7 7M20 12H4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
