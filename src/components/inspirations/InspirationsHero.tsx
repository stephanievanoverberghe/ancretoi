'use client';

import { useMemo } from 'react';

type Props = {
    latest: {
        title: string;
        videoUrl: string;
        summary?: string | null;
        tags?: string[] | null;
    } | null;
};

// Mini helper pour thumbnail YouTube
function youtubeThumb(url?: string) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com')) {
            const id = u.searchParams.get('v');
            if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        }
        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.replace('/', '');
            if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        }
        return null;
    } catch {
        return null;
    }
}

export default function InspirationsHero({ latest }: Props) {
    const bg = useMemo(() => youtubeThumb(latest?.videoUrl), [latest?.videoUrl]);

    return (
        <section className="relative isolate overflow-hidden rounded-3xl border border-brand-200 bg-white/80 ring-1 ring-white/40 shadow-sm">
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

            <div className="px-5 sm:px-8 md:px-10 py-10 sm:py-14 md:py-16">
                <div className="max-w-3xl">
                    <h1 className="font-serif text-[clamp(1.7rem,5.2vw,2.6rem)] leading-tight tracking-tight">{latest ? 'L’inspiration du moment' : 'Inspirations'}</h1>
                    <p className="mt-2 text-[15px] sm:text-base text-muted-foreground">
                        {latest
                            ? latest.summary || 'Une vidéo choisie pour t’aider à respirer, ressentir, t’ancrer.'
                            : 'Des vidéos qui éveillent la conscience, apaisent le mental et nourrissent l’âme.'}
                    </p>

                    {latest?.tags?.length ? (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {latest.tags.slice(0, 5).map((t) => (
                                <span key={t} className="rounded-full bg-brand-50 text-brand-800 ring-1 ring-brand-100 px-2 py-0.5 text-[11px] font-medium">
                                    {t}
                                </span>
                            ))}
                        </div>
                    ) : null}

                    <div className="mt-6 flex flex-wrap gap-3">
                        <a href="#grid" className="btn">
                            Explorer les inspirations
                        </a>
                        {latest?.videoUrl && (
                            <a
                                href={latest.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-xl bg-secondary-600 px-4 py-2.5 text-white text-sm hover:bg-secondary-700"
                            >
                                Voir la dernière vidéo
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
