'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
    description?: string;
    posterSrc?: string;
    youtubeId?: string;
    /** Flags serveur (passés depuis la page) */
    isAuthed?: boolean;
    hasActiveProgram?: boolean;
    activeProgramSlug?: string | null;
};

export default function SampleDay({
    title = 'Aperçu d’un jour — teaser 20s',
    description = 'Un extrait authentique : respiration guidée, intention du jour et carnet. Sans inscription.',
    posterSrc = '/images/sample-poster.webp',
    youtubeId = '3moPCb5lIdw',
    isAuthed = false,
    hasActiveProgram = false,
    activeProgramSlug = null,
}: Props) {
    const sectionRef = useRef<HTMLElement>(null);
    const [showPlayer, setShowPlayer] = useState(false);

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
                    track('sample_view');
                }
            },
            { threshold: 0.5 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [track]);

    const onPlay = () => {
        setShowPlayer(true);
        track('sample_play');
    };

    // Route de preview: day 1 du programme
    const previewPath = '/member/reset-7/day/1';

    // Libellé + destination selon état
    const cta = (() => {
        if (!isAuthed) {
            return {
                label: 'Essayer 1 jour gratuit',
                href: `/login?next=${encodeURIComponent(previewPath)}`,
            };
        }
        if (!hasActiveProgram) {
            return {
                label: 'Démarrer 1 jour gratuit',
                href: previewPath,
            };
        }
        // utilisateur déjà inscrit à un programme
        const slug = activeProgramSlug ?? 'reset-7';
        return {
            label: 'Continuer mon programme',
            href: `/member/${slug}/day/1`,
        };
    })();

    const onCta = () => track('sample_cta_click', { authed: isAuthed, hasActiveProgram, dest: cta.href });

    const iframeSrc = `https://www.youtube-nocookie.com/embed/${youtubeId}` + `?rel=0&modestbranding=1&playsinline=1&controls=1&mute=1${showPlayer ? '&autoplay=1' : ''}`;

    return (
        <section
            ref={sectionRef}
            id="sample-day"
            aria-labelledby="sample-title"
            className="
        relative mx-[calc(50%-50vw)] w-screen bg-brand-50/30
        py-16 sm:py-20 lg:py-24
      "
        >
            {/* halos premium + voile + filets or */}
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
                <header className="mb-8 sm:mb-10 lg:mb-12 text-center">
                    <h2 id="sample-title" className="font-serif text-[clamp(1.35rem,3.8vw,2rem)] leading-tight">
                        {title}
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">{description}</p>
                </header>

                <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white ring-1 ring-brand-200 shadow-[0_8px_24px_rgb(0_0_0/0.06)]">
                    <div className="relative aspect-video w-full bg-black">
                        {!showPlayer ? (
                            <button
                                type="button"
                                onClick={onPlay}
                                className="group relative grid h-full w-full place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                                aria-label="Lire l’aperçu vidéo"
                            >
                                <Image
                                    src={posterSrc}
                                    alt="Aperçu vidéo — main posée sur le cœur, lumière douce"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 800px"
                                    className="absolute inset-0 h-full w-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
                                <span
                                    className="relative inline-flex items-center justify-center h-16 w-16 rounded-full cursor-pointer bg-white/90 backdrop-blur ring-1 ring-brand-200 shadow-md transition group-hover:scale-105"
                                    aria-hidden
                                >
                                    <svg width="22" height="22" viewBox="0 0 24 24" className="translate-x-[1px] opacity-90">
                                        <path d="M8 5v14l11-7z" fill="currentColor" />
                                    </svg>
                                </span>
                                <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
                                    Muet par défaut
                                </span>
                            </button>
                        ) : (
                            <iframe
                                src={iframeSrc}
                                title="Teaser d’un jour"
                                className="absolute inset-0 h-full w-full"
                                loading="lazy"
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            />
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between sm:gap-4 sm:px-5">
                        <p className="text-sm text-secondary-800">20&nbsp;secondes pour ressentir l’ambiance : respiration, intention, carnet.</p>
                        <Link href={cta.href} onClick={onCta} className="btn">
                            {cta.label}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
