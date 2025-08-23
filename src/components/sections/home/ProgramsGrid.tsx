'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback } from 'react';
import { Clock, ArrowRight, Lock } from 'lucide-react';

// Déclare proprement les globals pour éviter les @ts-expect-error
declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
        posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
    }
}

type Program = {
    slug: string;
    title: string;
    duration_days: number;
    // élargi pour accepter la valeur JSON (string)
    status?: 'draft' | 'published' | string;
    price?: { amount_cents?: number | null } | null;
};

type Props = { programs: Program[] };

const assetBySlug: Record<string, { src: string; alt: string }> = {
    'reset-7': { src: '/images/programs/reset7.webp', alt: 'Cercle ondulant “Reset” en papier, améthyste claire, micro-points dorés' },
    'boussole-10': { src: '/images/programs/boussole10.webp', alt: 'Rose des vents en papier, repères or discrets sur fond lilas/sauge' },
    'ancrage-30': { src: '/images/programs/ancrage30.webp', alt: 'Ancre et cairn en papier, 30 repères suggérés' },
    'alchimie-90': { src: '/images/programs/alchimie90.webp', alt: 'Vase/alambic en papier, gradient améthyste vers or, 90 traits fins' },
};

export default function ProgramsGrid({ programs }: Props) {
    const track = useCallback((slug: string, position: number) => {
        if (typeof window === 'undefined') return;
        window.plausible?.('program_card_click', { props: { slug, position } });
        window.posthog?.capture('program_card_click', { slug, position });
    }, []);

    return (
        <section id="programmes" aria-labelledby="programmes-title" className="relative mx-[calc(50%-50vw)] w-screen py-14 sm:py-16 lg:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <header className="mb-8 sm:mb-10 lg:mb-12 text-center">
                    <h2 id="programmes-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Programmes guidés
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">7 • 10 • 30 • 90 jours — juste ce qu’il faut, au bon rythme.</p>
                </header>

                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
                    {programs.map((p, idx) => {
                        const asset = assetBySlug[p.slug] ?? { src: '/images/prog-placeholder-4x3.jpg', alt: '' };
                        const isComingSoon = (p.status && p.status !== 'published') || !p.price?.amount_cents;

                        return (
                            <li key={p.slug}>
                                <Link
                                    href={`/programs/${p.slug}`}
                                    onClick={() => track(p.slug, idx + 1)}
                                    className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 rounded-2xl"
                                    aria-label={`Voir ${p.title}${isComingSoon ? ' — bientôt' : ''}`}
                                >
                                    {/* Visuel */}
                                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                                        <Image
                                            src={asset.src}
                                            alt={asset.alt}
                                            fill
                                            sizes="(max-width: 1024px) 50vw, 25vw"
                                            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                                        />

                                        {/* Overlay dégradé bas pour lecture */}
                                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

                                        {/* Badge durée (gold) */}
                                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold-50/95 px-2.5 py-1 text-xs font-medium text-gold-800 ring-1 ring-gold-200 shadow-sm">
                                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                            {p.duration_days} jours
                                        </span>

                                        {/* Badge Bientôt si non achetable */}
                                        {isComingSoon && (
                                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-secondary-600/95 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-secondary-700/40 shadow-sm">
                                                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                                                Bientôt
                                            </span>
                                        )}

                                        {/* Bandeau titre + flèche */}
                                        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3">
                                            <h3 className="flex-1 truncate font-serif text-white text-[clamp(1rem,2.6vw,1.1rem)] leading-tight drop-shadow">{p.title}</h3>
                                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-brand-700 ring-1 ring-brand-100 transition-transform group-hover:translate-x-0.5">
                                                <ArrowRight className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
