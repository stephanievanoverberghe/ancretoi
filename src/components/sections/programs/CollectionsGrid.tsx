'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type Program, formatPrice } from '@/lib/programs-index';
import { Clock3, Info, ArrowRight, Lock } from 'lucide-react';

/* ---------- Analytics (typage strict) ---------- */
type CardEvent = 'program_card_view' | 'program_card_click' | 'programs_compare_expand';
type AnalyticsProps = Record<string, unknown>;
type PlausibleFn = (event: string, options?: { props?: AnalyticsProps }) => void;
type Posthog = { capture: (name: string, props?: AnalyticsProps) => void };

declare global {
    interface Window {
        plausible?: PlausibleFn;
        posthog?: Posthog;
    }
}

function track(event: CardEvent, props?: AnalyticsProps) {
    if (typeof window === 'undefined') return;
    if (props) window.plausible?.(event, { props });
    else window.plausible?.(event);
    window.posthog?.capture(event, props);
}

/* ---------- Filtres par durée ---------- */
type DurationFilter = 'all' | 7 | 10 | 30 | 90;

const FILTERS: Array<{ key: DurationFilter; label: string }> = [
    { key: 'all', label: 'Tous' },
    { key: 7, label: '7 j' },
    { key: 10, label: '10 j' },
    { key: 30, label: '30 j' },
    { key: 90, label: '90 j' },
];

/* ---------- Fallback visuels (identiques à ProgramsGrid) ---------- */
const ASSET_BY_SLUG: Record<string, { src: string; alt: string }> = {
    'reset-7': { src: '/images/programs/reset7.webp', alt: 'Cercle ondulant “Reset” en papier, améthyste claire, micro-points dorés' },
    'boussole-10': { src: '/images/programs/boussole10.webp', alt: 'Rose des vents en papier, repères or discrets sur fond lilas/sauge' },
    'ancrage-30': { src: '/images/programs/ancrage30.webp', alt: 'Ancre et cairn en papier, 30 repères suggérés' },
    'alchimie-90': { src: '/images/programs/alchimie90.webp', alt: 'Vase/alambic en papier, gradient améthyste vers or, 90 traits fins' },
};

/* ---------- Card (look identique à ProgramsGrid) ---------- */
function CardOverlay({ p, position }: { p: Program; position: number }) {
    const ref = useRef<HTMLElement | null>(null);
    const sent = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || sent.current) return;
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting && e.intersectionRatio >= 0.5 && !sent.current) {
                        sent.current = true;
                        track('program_card_view', { slug: p.slug, position });
                        io.disconnect();
                    }
                }
            },
            { threshold: [0, 0.5, 1] }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [p.slug, position]);

    const asset = p.cover ? { src: p.cover, alt: ASSET_BY_SLUG[p.slug]?.alt ?? '' } : ASSET_BY_SLUG[p.slug] ?? { src: '/images/prog-placeholder-4x3.jpg', alt: '' };

    const hasPrice = p.price?.amount_cents != null;
    const priceLabel = hasPrice ? formatPrice(p.price!) : null;

    return (
        <article ref={ref}>
            <Link
                href={`/programs/${p.slug}`}
                onClick={() => track('program_card_click', { slug: p.slug, position })}
                className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 rounded-2xl"
                aria-label={`Voir ${p.title}${hasPrice ? '' : ' — bientôt'}`}
            >
                {/* Visuel 4:3 */}
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

                    {/* Badge durée (or) */}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold-50/95 px-2.5 py-1 text-xs font-medium text-gold-800 ring-1 ring-gold-200 shadow-sm">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden />
                        {p.duration_days} jours
                    </span>

                    {/* À droite : PRIX si en vente, sinon Bientôt */}
                    {hasPrice ? (
                        <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 shadow-sm">
                            {priceLabel}
                        </span>
                    ) : (
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-secondary-600/95 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-secondary-700/40 shadow-sm">
                            <Lock className="h-3.5 w-3.5" aria-hidden />
                            Bientôt
                        </span>
                    )}

                    {/* Bandeau titre + flèche (identique) */}
                    <div className="absolute inset-x-3 bottom-3 flex items-center gap-3">
                        <h3 className="flex-1 truncate font-serif text-white text-[clamp(1rem,2.6vw,1.1rem)] leading-tight drop-shadow">{p.title}</h3>
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-brand-700 ring-1 ring-brand-100 transition-transform group-hover:translate-x-0.5">
                            <ArrowRight className="h-5 w-5" aria-hidden />
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
}

/* ---------- Section principale (accepte des props) ---------- */
type CollectionsGridProps = { programs: Program[] };

export default function CollectionsGrid({ programs }: CollectionsGridProps) {
    const [filter, setFilter] = useState<DurationFilter>('all');

    const filtered = useMemo(() => {
        if (filter === 'all') return programs;
        return programs.filter((p) => p.duration_days === filter);
    }, [filter, programs]);

    return (
        <section id="grid" aria-labelledby="programs-grid-title" className="relative mx-[calc(50%-50vw)] w-screen bg-brand-50/30 py-14 sm:py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {/* Header éditorial + filtres compacts */}
                <header className="mb-6 sm:mb-8">
                    <h2 id="programs-grid-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Choisis ton rythme, on s’occupe du reste
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">4 parcours clairs pour ancrer des rituels courts et tenables.</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">Durée :</span>
                        <div className="flex flex-wrap gap-1.5">
                            {FILTERS.map(({ key, label }) => {
                                const active = filter === key;
                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => setFilter(key)}
                                        className={[
                                            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition',
                                            active ? 'border-ormat bg-ormat text-foreground' : 'border-brand-200 bg-background/70 text-foreground hover:bg-brand-50/60',
                                        ].join(' ')}
                                        aria-pressed={active}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <Info className="h-4 w-4 text-ormat" aria-hidden />
                            <Link href="#compare" onClick={() => track('programs_compare_expand')} className="text-sm font-semibold text-ormat hover:underline">
                                Quel programme pour moi ?
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Grille : mêmes cards que ProgramsGrid, avec prix/Bientôt */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {filtered.map((p, idx) => (
                        <CardOverlay key={p.slug} p={p} position={idx + 1} />
                    ))}
                </div>

                {/* Réassurance (🎥 en premier) */}
                <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50/40 p-3 text-xs sm:text-sm text-muted-foreground">
                    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <li>🎥 Vidéos courtes</li>
                        <li>🎧 Audios guidés</li>
                        <li>📄 Fiches PDF</li>
                        <li>🕒 Rituels 10–35 min/j</li>
                        <li>♾️ Accès à vie</li>
                        <li>✅ Sans matériel</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
