// components/program/sections/Hero.tsx
'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Clock3, Gauge, Sparkles, Headphones, Play } from 'lucide-react';

import BuyButton from '@/components/BuyButton';
import type { Program } from '@/lib/programs-index';
import { formatPrice } from '@/lib/programs-index';
import { track } from '@/lib/analytics.client';

type Props = {
    program: Program;
    /** étiquette "charge/jour" injectée depuis la BDD (ex. "20–40 min/j") */
    dailyLoadLabel?: string;
    sampleAudioSrc?: string;
    heroSrcOverride?: string;
};

type ChipKind = 'time' | 'charge' | 'level';

export default function Hero({ program, dailyLoadLabel, sampleAudioSrc = '/audio/samples/program-sample-60s.mp3', heroSrcOverride }: Props) {
    const isAvailable = program.price?.amount_cents != null;
    const isFree = (program.price?.amount_cents ?? NaN) === 0;
    const priceLabel = formatPrice(program.price) ?? null;

    // ✅ plus aucun appel lib externe : on utilise uniquement la donnée injectée
    const charge = useMemo(() => dailyLoadLabel ?? '10–20 min/j', [dailyLoadLabel]);

    const chips: Array<{ icon: ChipKind; label: string }> = [
        { icon: 'time', label: `${program.duration_days} jours` },
        { icon: 'charge', label: charge },
        { icon: 'level', label: program.level },
    ];

    const heroSrc = heroSrcOverride || program.cover || '/images/programs/hero-programs.webp';

    const sectionRef = useRef<HTMLElement | null>(null);
    const viewedRef = useRef(false);
    const observeTrack = useCallback(() => {
        if (!sectionRef.current || viewedRef.current) return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (!viewedRef.current && e.isIntersecting && e.intersectionRatio >= 0.5) {
                        viewedRef.current = true;
                        track('program_detail_hero_view', { slug: program.slug });
                        io.disconnect();
                    }
                }
            },
            { threshold: [0, 0.5, 1] }
        );
        io.observe(sectionRef.current);
        return () => io.disconnect();
    }, [program.slug]);

    useEffect(() => observeTrack(), [observeTrack]);

    const [open, setOpen] = useState(false);

    // ✅ rend le portail seulement après mount (évite mismatch hydratation)
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <section
            ref={sectionRef}
            id="program-detail-hero"
            aria-labelledby="hero-title"
            aria-describedby="hero-desc"
            className="relative isolate mx-[calc(50%-50vw)] w-screen overflow-hidden min-h-[56svh] md:min-h-[62svh] flex items-center"
        >
            {/* BG full-bleed + voiles */}
            <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden="true">
                <Image src={heroSrc} alt="" fill sizes="100vw" className="object-cover object-[center_45%] opacity-90" priority={false} />
                <div className="absolute inset-0 md:hidden bg-gradient-to-b from-white/92 via-white/78 to-white/28" />
                <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-white/90 via-white/70 to-transparent" />
                <div className="absolute inset-0 hidden sm:block bg-brand-50/30 mix-blend-soft-light" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
            </div>

            {/* halo conique doux */}
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

            {/* filet or */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gold-200" aria-hidden="true" />

            {/* contenu */}
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 py-10 sm:py-14 lg:py-16">
                <div className="relative max-w-[44rem]">
                    <div className="pointer-events-none absolute -inset-4 sm:-inset-6 -z-10 rounded-3xl bg-white/45 sm:bg-white/30 backdrop-blur-[2px] sm:backdrop-blur-[1.5px] ring-1 ring-white/50 sm:ring-white/40" />

                    <nav className="mb-3 text-sm text-muted-foreground" aria-label="Fil d’Ariane">
                        <Link className="hover:underline" href="/">
                            Accueil
                        </Link>{' '}
                        <span aria-hidden>›</span>{' '}
                        <Link className="hover:underline" href="/programs">
                            Programmes
                        </Link>{' '}
                        <span aria-hidden>›</span>{' '}
                        <span aria-current="page" className="text-foreground">
                            {program.title}
                        </span>
                    </nav>

                    <h1 id="hero-title" className="font-serif text-[clamp(1.7rem,6.2vw,2.5rem)] md:text-[clamp(2.1rem,3.6vw,3.25rem)] leading-tight tracking-tight">
                        {program.title} — {program.duration_days} jours
                    </h1>

                    <p id="hero-desc" className="mt-3 sm:mt-4 text-[15px] sm:text-base md:text-lg leading-relaxed text-muted-foreground">
                        {program.tagline}
                    </p>

                    <ul className="mt-5 flex flex-wrap gap-2">
                        {chips.map((c) => (
                            <li
                                key={`${c.icon}-${c.label}`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-background/70 px-3 py-1 text-xs font-medium text-foreground backdrop-blur"
                            >
                                {chipIcon(c.icon)}
                                <span>{c.label}</span>
                            </li>
                        ))}
                        {!isAvailable && (
                            <li className="inline-flex items-center gap-1.5 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">
                                Bientôt
                            </li>
                        )}
                    </ul>

                    <p className="mt-3 text-sm text-muted-foreground">Rituels courts, tenables. Accès à vie. Sans matériel.</p>

                    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {isAvailable ? (
                            <BuyButton slug={program.slug} isFree={isFree} />
                        ) : (
                            <button onClick={() => track('program_detail_cta_click', { slug: program.slug, target: 'waitlist' })} className="btn w-full sm:w-auto justify-center">
                                Être prévenu·e
                            </button>
                        )}

                        <button
                            onClick={() => {
                                setOpen(true);
                                track('program_detail_cta_click', { slug: program.slug, target: 'hero_secondary_sample' });
                            }}
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-brand-200 bg-background/70 px-4 py-3.5 text-[15px] sm:text-sm transition-colors hover:bg-brand-100 cursor-pointer"
                        >
                            <Play className="w-4 h-4" />
                            <span className="ml-2">Écouter un extrait</span>
                        </button>

                        {priceLabel && <span className="inline-flex items-center text-sm text-muted-foreground">— {priceLabel}</span>}
                    </div>
                </div>
            </div>

            {/* ───────────────── Sticky mobile en portail ───────────────── */}
            {mounted &&
                createPortal(
                    <div className="lg:hidden fixed bottom-0 inset-x-0 z-[140] bg-white/90 backdrop-blur border-t border-brand-100 pointer-events-auto">
                        <div className="mx-auto max-w-3xl px-4 pt-3 pb-[calc(max(env(safe-area-inset-bottom),0px)+14px)] flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{program.title}</div>
                                <div className="text-xs text-muted-foreground">
                                    {program.duration_days} j • {program.level}
                                </div>
                            </div>
                            <div className="text-sm font-semibold">{priceLabel ?? 'Bientôt'}</div>
                            {isAvailable ? (
                                <BuyButton slug={program.slug} isFree={isFree} />
                            ) : (
                                <button onClick={() => track('program_detail_cta_click', { slug: program.slug, target: 'waitlist_mobile' })} className="btn">
                                    Être prévenu·e
                                </button>
                            )}
                        </div>
                    </div>,
                    document.body
                )}

            {/* modal audio */}
            {open && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white ring-1 ring-brand-100/60 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium mb-3">
                            <Headphones className="w-4 h-4" />
                            Extrait audio (≈ 60 s)
                        </div>
                        <audio src={sampleAudioSrc} controls className="w-full" preload="none" />
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setOpen(false)} className="btn-secondary">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function chipIcon(kind: ChipKind) {
    const cls = 'h-4 w-4';
    if (kind === 'time') return <Clock3 className={cls} aria-hidden />;
    if (kind === 'charge') return <Gauge className={cls} aria-hidden />;
    return <Sparkles className={cls} aria-hidden />;
}
