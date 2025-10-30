'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

/* --- Reading progress --- */
export function ReadingProgress() {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const h = document.documentElement;
            const scrolled = h.scrollTop || document.body.scrollTop;
            const height = h.scrollHeight - h.clientHeight;
            setProgress(height > 0 ? Math.min(100, (scrolled / height) * 100) : 0);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return (
        <div className="sticky top-0 z-20 h-[3px] w-full bg-transparent">
            <div className="h-[3px] bg-gradient-to-r from-brand-600 to-amber-500" style={{ width: `${progress}%` }} aria-hidden />
        </div>
    );
}

/* --- Share --- */
export function ShareBar({ title }: { title: string }) {
    const share = useCallback(async () => {
        try {
            const url = window.location.href;
            if (navigator.share) {
                await navigator.share({ title, url });
            } else {
                await navigator.clipboard.writeText(url);
                alert('Lien copié ✨');
            }
        } catch {
            /* ignore */
        }
    }, [title]);

    return (
        <div className="flex items-center gap-2">
            <button onClick={share} className="rounded-xl border border-border bg-white px-3 py-1.5 text-sm hover:bg-brand-50/60">
                Partager
            </button>
        </div>
    );
}

/* --- Prev/Next --- */
export function NavCard({ kind, slug, title }: { kind: 'prev' | 'next'; slug?: string; title?: string }) {
    if (!slug) return <div className="hidden sm:block" />;
    return (
        <Link
            href={`/blog/${slug}`}
            className={`group relative overflow-hidden rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md ${
                kind === 'prev' ? 'text-left' : 'text-right'
            }`}
        >
            <div className="text-xs text-muted-foreground">{kind === 'prev' ? '← Article précédent' : 'Article suivant →'}</div>
            <div className="font-serif text-[clamp(1rem,2.5vw,1.15rem)] leading-snug group-hover:text-brand-700">{title || slug.replace(/-/g, ' ')}</div>
        </Link>
    );
}
