// src/components/programs/cards/ProgramCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock3, Lock } from 'lucide-react';
import { track } from '@/lib/analytics.client';

// Type minimal pour la card
export type ProgramCardProgram = {
    slug: string;
    title: string;
    duration_days: number;
    status?: 'draft' | 'preflight' | 'published' | string;
    cover?: string | null;
    price?: { amount_cents: number | null; currency?: string } | null;

    // ⬇️ NEW: pour le filtre par niveau
    level?: 'Basique' | 'Cible' | 'Premium' | (string & {});
};

type Props = { program: ProgramCardProgram; position?: number };

export default function ProgramCard({ program, position = 0 }: Props) {
    const hasPrice = program.price?.amount_cents != null;

    const priceLabel = hasPrice
        ? new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: (program.price?.currency ?? 'EUR').toUpperCase(),
          }).format((program.price!.amount_cents as number) / 100)
        : null;

    const src = program.cover || '/images/prog-placeholder-4x3.jpg';

    // 👉 Cliquable UNIQUEMENT si publié
    const isUnpublished = (program.status && program.status !== 'published') || false;
    // 👉 Badge “Bientôt” si non publié OU pas de prix
    const showComingSoon = isUnpublished || !hasPrice;

    const CardInner = (
        <div
            className={[
                'group block h-full rounded-2xl',
                isUnpublished ? 'cursor-not-allowed opacity-95' : 'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60',
            ].join(' ')}
            aria-label={showComingSoon ? `${program.title} — bientôt` : `Voir ${program.title}`}
            aria-disabled={isUnpublished || undefined}
            tabIndex={isUnpublished ? -1 : undefined}
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                <Image src={src} alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]" />

                {/* Overlay dégradé bas */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/60 via-black/25 to-transparent" />

                {/* Badge durée (gold) */}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold-50/95 px-2.5 py-1 text-xs font-medium text-gold-800 ring-1 ring-gold-200 shadow-sm">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden />
                    {program.duration_days} jours
                </span>

                {/* À droite : prix si OK, sinon “Bientôt” */}
                {showComingSoon ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-secondary-600/95 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-secondary-700/40 shadow-sm">
                        <Lock className="h-3.5 w-3.5" aria-hidden />
                        Bientôt
                    </span>
                ) : priceLabel ? (
                    <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 shadow-sm">
                        {priceLabel}
                    </span>
                ) : null}

                {/* Titre + flèche (flèche atténuée si non cliquable) */}
                <div className="absolute inset-x-3 bottom-3 flex items-center gap-3">
                    <h3 className="flex-1 truncate font-serif text-white text-[clamp(1rem,2.6vw,1.1rem)] leading-tight drop-shadow">{program.title}</h3>
                    <span
                        className={[
                            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-brand-700 ring-1 ring-brand-100 transition-transform',
                            isUnpublished ? 'opacity-60' : 'group-hover:translate-x-0.5',
                        ].join(' ')}
                        aria-hidden
                    >
                        <ArrowRight className="h-5 w-5" />
                    </span>
                </div>
            </div>
        </div>
    );

    // ——— Rendu ———
    if (isUnpublished) {
        // Non cliquable tant que ce n'est pas publié
        return <article>{CardInner}</article>;
    }

    // Cliquable si publié
    return (
        <article>
            <Link
                href={`/programs/${program.slug}`}
                onClick={() => track('program_card_click', { slug: program.slug, position })}
                className="block rounded-2xl"
                aria-label={`Voir ${program.title}`}
            >
                {CardInner}
            </Link>
        </article>
    );
}
