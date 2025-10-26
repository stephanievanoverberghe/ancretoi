'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProgramCard, { type ProgramCardProgram } from '@/components/programs/cards/ProgramCard';
import { Info } from 'lucide-react';
import { track } from '@/lib/analytics.client';

/* ---------- Filtres par niveau ---------- */
type LevelFilter = 'all' | 'Basique' | 'Cible' | 'Premium';

const FILTERS: Array<{ key: LevelFilter; label: string }> = [
    { key: 'all', label: 'Tous' },
    { key: 'Basique', label: 'Basique' },
    { key: 'Cible', label: 'Cible' },
    { key: 'Premium', label: 'Premium' },
];

function normLevel(lvl?: ProgramCardProgram['level']): 'Basique' | 'Cible' | 'Premium' | undefined {
    if (!lvl) return undefined;
    const s = String(lvl).toLowerCase();
    if (s === 'basique' || s === 'beginner') return 'Basique';
    if (s === 'cible' || s === 'intermediate' || s === 'intermédiaire') return 'Cible';
    if (s === 'premium' || s === 'advanced' || s === 'avancé') return 'Premium';
    return undefined; // inconnu => pas filtré si "all", exclu si un filtre précis est choisi
}

type Props = { programs: ProgramCardProgram[] };

export default function CollectionsGrid({ programs }: Props) {
    const [filter, setFilter] = useState<LevelFilter>('all');

    const filtered = useMemo(() => {
        if (filter === 'all') return programs;
        // garde seulement ceux dont le level normalisé correspond
        return programs.filter((p) => normLevel(p.level) === filter);
    }, [filter, programs]);

    return (
        <section id="grid" aria-labelledby="programs-grid-title" className="relative mx-[calc(50%-50vw)] w-screen overflow-hidden scroll-mt-24 py-12 sm:py-16 md:py-24">
            {/* Fond papier zen */}
            <div className="absolute inset-0 -z-10" aria-hidden>
                <Image src="/images/texture-soft.webp" alt="" fill sizes="100vw" className="object-cover opacity-45" priority={false} />
                <div className="absolute inset-0 bg-secondary-50/70" />
                <div className="absolute inset-x-0 top-0 h-px bg-gold-100/80" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-gold-100/80" />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {/* Header éditorial + filtres */}
                <header className="mb-6 sm:mb-8">
                    <h2 id="programs-grid-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Choisis ton rythme, on s’occupe du reste
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">4 parcours clairs pour ancrer des rituels courts et tenables.</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">Niveau :</span>
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

                {/* Grille */}
                <div className="grid gap-6 lg:grid-cols-4">
                    {filtered.map((p, idx) => (
                        <ProgramCard key={p.slug} program={p} position={idx + 1} />
                    ))}
                </div>

                {/* Réassurance */}
                <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50/40 p-3 text-xs sm:text-sm text-muted-foreground">
                    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <li>🎥 Vidéos courtes</li>
                        <li>🎧 Audios guidés</li>
                        <li>📄 Fiches PDF</li>
                        <li>🕒 Rituels 20–60 min/j</li>
                        <li>♾️ Accès à vie</li>
                        <li>✅ Sans matériel</li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
