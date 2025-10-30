// src/components/sections/home/BlogTeasers.tsx
import Image from 'next/image';
import Link from 'next/link';

import { dbConnect } from '@/db/connect';
import { PostModel } from '@/db/schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/* ---------- Types ---------- */
type PostCard = {
    slug: string;
    title: string;
    date: string; // ISO
    excerpt: string;
    hero: { src: string; alt: string };
    readingTime?: number;
};

type PostLean = {
    slug: string;
    title?: string | null;
    summary?: string | null;
    content?: string | null;
    coverPath?: string | null;
    coverAlt?: string | null;
    readingTimeMin?: number | null;
    publishedAt?: string | Date | null;
    updatedAt?: string | Date | null;
    createdAt?: string | Date | null;
};

/* ---------- Utils ---------- */
function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function stripMarkdown(md: string) {
    return (md || '')
        .replace(/`{1,3}[^`]*`{1,3}/g, ' ')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
        .replace(/\[[^\]]*\]\([^)]+\)/g, ' ')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/^>\s+/gm, '')
        .replace(/[*_~`>#]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function excerptFrom(summary?: string | null, content?: string | null, max = 220) {
    const src = (summary && summary.trim()) || stripMarkdown(content || '');
    if (!src) return '';
    if (src.length <= max) return src;
    const cut = src.slice(0, max);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

function normalizePublicPath(p?: string | null) {
    if (!p) return '';
    return p.startsWith('/') ? p : `/${p}`;
}

/* ---------- Data ---------- */
async function loadPosts(): Promise<PostCard[]> {
    await dbConnect();

    const docs = await PostModel.find({
        status: 'published',
        deletedAt: null,
    })
        .select({
            slug: 1,
            title: 1,
            summary: 1,
            content: 1,
            coverPath: 1,
            coverAlt: 1,
            readingTimeMin: 1,
            publishedAt: 1,
            updatedAt: 1,
            createdAt: 1,
        })
        .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
        .limit(3)
        .lean<PostLean[]>(); // 👈 typé: plus de any

    return docs.map((d) => {
        const date = (d.publishedAt ? new Date(d.publishedAt) : d.updatedAt ? new Date(d.updatedAt) : d.createdAt ? new Date(d.createdAt) : new Date()).toISOString();

        const excerpt = excerptFrom(d.summary, d.content);
        const src = normalizePublicPath(d.coverPath);
        const alt = (d.coverAlt && d.coverAlt.trim()) || 'Image de couverture';

        return {
            slug: d.slug,
            title: (d.title || '').trim() || 'Sans titre',
            date,
            excerpt,
            hero: { src, alt },
            readingTime: typeof d.readingTimeMin === 'number' ? d.readingTimeMin : undefined,
        };
    });
}

/* ---------- Component ---------- */
export default async function BlogTeasers() {
    const posts = await loadPosts();

    return (
        <section aria-labelledby="blog-teasers-title" className="relative mx-[calc(50%-50vw)] w-screen bg-brand-50/30 py-16 sm:py-20 lg:py-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
                <header className="mb-8 sm:mb-10 text-center">
                    <h2 id="blog-teasers-title" className="font-serif text-[clamp(1.4rem,4.2vw,2rem)] leading-tight">
                        Extraits — Blog & Inspirations
                    </h2>
                    <p className="mt-3 text-[15px] sm:text-base text-muted-foreground">Nourrir la relation, même si l’achat n’est pas immédiat.</p>
                </header>

                <div className="grid items-stretch gap-5 sm:gap-6 md:grid-cols-3">
                    {posts.map((p) => (
                        <article
                            key={p.slug}
                            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-white/90 ring-1 ring-white/60 shadow-[0_12px_28px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_16px_34px_rgba(0,0,0,0.09)] hover:-translate-y-[2px]"
                        >
                            {/* Image */}
                            <Link href={`/blog/${p.slug}`} aria-label={p.title} className="block">
                                <div className="relative aspect-[4/3] w-full overflow-hidden">
                                    {p.hero.src ? (
                                        <Image
                                            src={p.hero.src}
                                            alt={p.hero.alt}
                                            fill
                                            sizes="(max-width: 768px) 92vw, 33vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                            <svg width="40" height="40" viewBox="0 0 24 24">
                                                <path
                                                    d="M21 19V5a2 2 0 0 0-2-2H5C3.9 3 3 3.9 3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm11 6-5-7-4 5-2-3-4 5h15Z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-black/5 to-transparent" aria-hidden />
                                    <div className="absolute left-3 top-3 flex items-center gap-2">
                                        <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-foreground ring-1 ring-border">{formatDate(p.date)}</span>
                                        {typeof p.readingTime === 'number' && (
                                            <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] text-secondary-800 ring-1 ring-border">{p.readingTime} min</span>
                                        )}
                                    </div>
                                </div>
                            </Link>

                            <div className="h-px w-full bg-gold-100/80" aria-hidden />

                            {/* Contenu */}
                            <div className="flex flex-1 flex-col p-4 sm:p-5">
                                <header>
                                    <h3 className="font-serif text-[clamp(1rem,2.6vw,1.15rem)] leading-snug">
                                        <Link href={`/blog/${p.slug}`} className="transition-colors hover:text-brand-700">
                                            {p.title}
                                        </Link>
                                    </h3>
                                </header>

                                <div className="mt-2 flex-1">
                                    <p className="line-clamp-3 text-[15px] text-brand-900">{p.excerpt}</p>
                                </div>

                                <div className="mt-4">
                                    <Link
                                        href={`/blog/${p.slug}`}
                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm transition hover:bg-brand-50/60 hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 sm:w-auto"
                                    >
                                        Lire l’article
                                        <span
                                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gold-50 ring-1 ring-gold-200 transition-transform group-hover:translate-x-[2px]"
                                            aria-hidden
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24">
                                                <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            <div
                                className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-gold-100/40 blur-2xl [mask-image:radial-gradient(closest-side,black,transparent)]"
                                aria-hidden
                            />
                        </article>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 rounded-xl border border-secondary-200 btn w-full sm:w-auto px-4 py-2.5 text-[15px] transition hover:bg-secondary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                    >
                        Voir tous les articles
                    </Link>
                </div>
            </div>
        </section>
    );
}
