// src/components/blog/BlogHero.tsx
'use client';

import { useMemo } from 'react';

type Props = {
    featured: {
        slug: string;
        title?: string | null;
        summary?: string | null;
        coverPath?: string | null;
        coverAlt?: string | null;
    } | null;
};

function normalizePublicPath(p?: string | null) {
    if (!p) return null;
    return p.startsWith('/') ? p : `/${p}`;
}

export default function BlogHero({ featured }: Props) {
    const bg = useMemo(() => normalizePublicPath(featured?.coverPath), [featured?.coverPath]);

    return (
        <section className="relative isolate overflow-hidden w-screen left-1/2 right-1/2 -mx-[50vw] border-b border-brand-200 bg-white/80 ring-1 ring-white/40 shadow-sm">
            {/* Background */}
            <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{
                    backgroundImage: bg ? `url(${bg})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: bg ? 'saturate(105%) contrast(102%)' : undefined,
                }}
            />
            {/* Voiles pour lisibilité */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/92 via-white/70 to-white/20" />
            <div className="absolute inset-0 -z-10 bg-brand-50/30 mix-blend-soft-light" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gold-200" />

            <div className="mx-auto max-w-6xl px-6 sm:px-8 md:px-10 py-14 sm:py-18 md:py-22">
                <div className="max-w-3xl">
                    <h1 className="font-serif text-[clamp(2rem,5.5vw,3rem)] leading-tight tracking-tight">{featured ? 'À la une' : 'Blog'}</h1>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">{featured?.summary || 'Des articles pour respirer, clarifier et avancer, en douceur.'}</p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <a href="#grid" className="btn">
                            Explorer les articles
                        </a>
                        {featured?.slug && (
                            <a
                                href={`/blog/${featured.slug}`}
                                className="inline-flex items-center justify-center rounded-xl bg-secondary-600 px-4 py-2.5 text-white text-sm hover:bg-secondary-700"
                            >
                                Lire l’article à la une
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
