'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';

declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
        posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
    }
}

type Props = {
    name?: string;
    role?: string;
    portraitSrc?: string; // /images/founder.jpg|.webp
    tagline?: string;
    bio?: string[];
    ctaHref?: string; // /blog
};

export default function Founder({
    name = 'Stéphanie Vanoverberghe',
    role = 'Fondatrice — Ancre-toi',
    portraitSrc = '/images/founder.webp',
    tagline = 'Depuis 2011, j’explore le mieux-être et la méditation. Aujourd’hui, je transmets l’essentiel : des pratiques courtes, tenables et apaisantes.',
    bio = [
        'Plus de dix ans d’exploration : formations, retraites de méditation et approches holistiques — j’ai gardé ce qui marche vraiment.',
        'Mon repère : revenir au corps et au souffle, installer des rituels simples qui tiennent même les jours chargés.',
        'Ma posture : douceur, clarté, autonomie — avancer à ton rythme, sans pression ni culpabilité.',
        'Je partage cette expérience à travers des parcours guidés pour retrouver présence, sens et confiance au quotidien.',
    ],
    ctaHref = '/blog',
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
                    track('founder_view');
                }
            },
            { threshold: 0.5 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [track]);

    const onCta = () => track('founder_cta_click');

    return (
        <section ref={sectionRef} id="founder" aria-labelledby="founder-title" className="relative mx-[calc(50%-50vw)] w-screen bg-brand-50/30 py-16 sm:py-20 lg:py-24">
            {/* filets or haut/bas */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden={true} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden={true} />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                {/* En-tête léger */}
                <header className="mb-8 sm:mb-10 text-center">
                    <h2 id="founder-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Qui je suis — fondatrice
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">Un lien humain, des valeurs claires — pour avancer en confiance.</p>
                </header>

                {/* Mobile-first: pile → 2 colonnes dès md */}
                <div className="grid gap-8 md:grid-cols-2 md:items-center">
                    {/* Texte en premier dans le DOM pour l’accessibilité/SEO, portrait avant visuellement en mobile si tu préfères → inverse avec order classes */}
                    <div className="space-y-5 order-2 md:order-none">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-secondary-700">{role}</div>
                            <h3 className="mt-1 font-serif text-[clamp(1.25rem,3.2vw,1.75rem)] leading-tight">{name}</h3>
                            <p className="mt-2 text-[15px] sm:text-base text-brand-900">{tagline}</p>
                        </div>

                        <ul className="space-y-3">
                            {bio.map((p, i) => (
                                <li key={i} className="text-[15px] leading-relaxed text-brand-900">
                                    {p}
                                </li>
                            ))}
                        </ul>

                        <div className="pt-1">
                            <Link href={ctaHref} onClick={onCta} className="btn w-full sm:w-auto" aria-label="Me lire sur le blog">
                                Me lire sur le blog
                            </Link>
                            <p className="mt-2 text-center sm:text-left text-xs text-muted-foreground">Articles courts & concrets — respiration, rituels, mise en pratique.</p>
                        </div>
                    </div>

                    {/* Portrait 4:5 — carte clean */}
                    <div className="order-1 md:order-none">
                        <figure className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white ring-1 ring-brand-200 shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                            <Image
                                src={portraitSrc}
                                alt={`${name} — portrait éditorial, lumière douce`}
                                fill
                                sizes="(max-width: 768px) 92vw, 40vw"
                                className="object-cover"
                                priority={false}
                            />
                        </figure>
                    </div>
                </div>
            </div>
        </section>
    );
}
