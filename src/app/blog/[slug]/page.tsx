// src/app/blog/[slug]/page.tsx
import 'server-only';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { dbConnect } from '@/db/connect';
import { PostModel } from '@/db/schemas';

import { ReadingProgress, ShareBar, NavCard } from './components/ReadingProgress';

/* ================= Types ================= */
type PostLean = {
    slug: string;
    title: string;
    summary?: string | null;
    content?: string | null;
    coverPath?: string | null;
    coverAlt?: string | null;
    category?: string | null;
    tags?: string[] | null;
    readingTimeMin?: number | null;
    publishedAt?: string | Date | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    canonicalUrl?: string | null;
};

type NavLean = { slug: string; title?: string } | null;

/* ============== Utils (server) ============== */

function normalizePublicPath(p?: string | null) {
    if (!p) return '';
    return p.startsWith('/') ? p : `/${p}`;
}

function formatDateHuman(d?: string | Date | null) {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function computeReadingTime(text: string) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
}

/** mini markdown → html (titres, italique, gras, listes, blockquote, code inline, liens) */
function mdToHtml(md: string) {
    let html = md;

    // escape basique
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // code inline `code`
    html = html.replace(/`([^`]+?)`/g, '<code>$1</code>');

    // bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // italic *text*
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

    // links [txt](url)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

    // headings
    html = html
        .replace(/^###\s+(.+)$/gm, (_, t) => `<h3 id="${slugify(t)}">${t}</h3>`)
        .replace(/^##\s+(.+)$/gm, (_, t) => `<h2 id="${slugify(t)}">${t}</h2>`)
        .replace(/^#\s+(.+)$/gm, (_, t) => `<h1>${t}</h1>`);

    // blockquote
    html = html.replace(/^(>\s?)(.+)$/gm, '<blockquote>$2</blockquote>');

    // ordered list
    html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<ol start="$1"><li>$2</li></ol>');
    // unordered list
    html = html.replace(/^[-•]\s+(.+)$/gm, '<ul><li>$1</li></ul>');

    // fusionner listes contiguës
    html = html.replace(/<\/ol>\s*<ol[^>]*>/g, '').replace(/<\/ul>\s*<ul[^>]*>/g, '');

    // paragraphs (lignes non-balayées)
    html = html
        .split(/\n{2,}/)
        .map((block) => {
            if (/^\s*<(h1|h2|h3|ul|ol|li|blockquote)/.test(block)) return block;
            return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
        })
        .join('\n');

    return html;
}

function slugify(s: string) {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function buildToc(md: string) {
    const out: { id: string; text: string; level: 2 | 3 }[] = [];
    const lines = md.split('\n');
    for (const line of lines) {
        const m2 = /^##\s+(.+)$/.exec(line);
        if (m2) out.push({ id: slugify(m2[1]), text: m2[1], level: 2 });
        const m3 = /^###\s+(.+)$/.exec(line);
        if (m3) out.push({ id: slugify(m3[1]), text: m3[1], level: 3 });
    }
    return out;
}

/* ============== Data access ============== */

async function getPostBySlug(slug: string) {
    await dbConnect();
    const doc = await PostModel.findOne({
        slug,
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
            category: 1,
            tags: 1,
            readingTimeMin: 1,
            publishedAt: 1,
            seoTitle: 1,
            seoDescription: 1,
            canonicalUrl: 1,
            _id: 0,
        })
        .lean<PostLean>()
        .exec();

    if (!doc) notFound();
    return doc;
}

async function getPrevNext(publishedAt: Date): Promise<{ prev: NavLean; next: NavLean }> {
    const [prev, next] = await Promise.all([
        PostModel.findOne({
            status: 'published',
            deletedAt: null,
            publishedAt: { $lt: publishedAt },
        })
            .sort({ publishedAt: -1 })
            .select({ slug: 1, title: 1, _id: 0 })
            .lean<{ slug: string; title?: string } | null>(), // ✅ important

        PostModel.findOne({
            status: 'published',
            deletedAt: null,
            publishedAt: { $gt: publishedAt },
        })
            .sort({ publishedAt: 1 })
            .select({ slug: 1, title: 1, _id: 0 })
            .lean<{ slug: string; title?: string } | null>(), // ✅ important
    ]);

    return { prev, next };
}

/* ============== Next metadata ============== */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    const title = (post.seoTitle && post.seoTitle.trim()) || `${post.title} — Ancre-toi`;
    const description = (post.seoDescription && post.seoDescription.trim()) || post.summary || '';
    const image = normalizePublicPath(post.coverPath) || '';
    const url = post.canonicalUrl || undefined;

    return {
        title,
        description,
        alternates: url ? { canonical: url } : undefined,
        openGraph: {
            type: 'article',
            title: post.title,
            description,
            images: image ? [{ url: image, alt: post.coverAlt || post.title }] : undefined,
        },
    };
}

export const revalidate = 600;

/* ============== Page ============== */

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    const cover = normalizePublicPath(post.coverPath);
    const dateLabel = formatDateHuman(post.publishedAt || undefined);

    const bodyMd = (post.content || '').trim();
    const bodyHtml = mdToHtml(bodyMd);
    const toc = buildToc(bodyMd);

    const rt = post.readingTimeMin && post.readingTimeMin > 0 ? post.readingTimeMin : computeReadingTime(`${post.title} ${post.summary ?? ''} ${bodyMd}`);

    const { prev, next } = post.publishedAt ? await getPrevNext(new Date(post.publishedAt)) : { prev: null, next: null };

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        description: post.summary ?? '',
        image: cover ? [cover] : undefined,
    };

    return (
        <section className="relative bg-white">
            {/* Reading progress bar */}
            <ReadingProgress />

            {/* HERO full-bleed */}
            <div className="relative mx-[calc(50%-50vw)] w-screen">
                <div className="relative h-[42vh] min-h-[280px] max-h-[520px]">
                    {cover ? (
                        <Image src={cover} alt={post.coverAlt || post.title} fill priority sizes="100vw" className="object-cover" />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-brand-100 to-amber-100" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-1/2 w-full max-w-6xl -translate-x-1/2 px-4 sm:px-6 md:px-8">
                        <div className="max-w-3xl text-white drop-shadow">
                            {dateLabel && (
                                <div className="text-xs uppercase tracking-wide opacity-90">
                                    {dateLabel} • {rt} min de lecture
                                </div>
                            )}
                            <h1 className="mt-1 font-serif text-[clamp(1.8rem,4.2vw,2.6rem)] leading-tight">{post.title}</h1>
                            {post.summary && <p className="mt-2 text-[15px] opacity-95">{post.summary}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT + TOC */}
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:px-8 lg:grid-cols-[1fr_minmax(220px,280px)]">
                <article className="prose prose-neutral max-w-none prose-headings:font-serif prose-blockquote:border-brand-300 prose-a:text-secondary-800 hover:prose-a:text-secondary-900">
                    {/* Back link + share */}
                    <div className="mb-6 flex items-center justify-between">
                        <Link href="/blog" className="text-sm text-secondary-700 hover:text-secondary-900">
                            ← Tous les articles
                        </Link>
                        <ShareBar title={post.title} />
                    </div>

                    {/* Body: drop-cap sur 1er paragraphe */}
                    <div
                        className="[&_p:first-of-type:first-letter]:float-left [&_p:first-of-type:first-letter]:mr-2 [&_p:first-of-type:first-letter]:text-5xl [&_p:first-of-type:first-letter]:font-serif [&_p:first-of-type:first-letter]:leading-[0.9]"
                        dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                </article>

                {/* TOC sticky */}
                <aside className="hidden lg:block">
                    {toc.length ? (
                        <div className="sticky top-24 rounded-2xl border border-brand-100 bg-white p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-secondary-700">Sommaire</div>
                            <nav className="mt-3 space-y-1.5">
                                {toc.map((i) => (
                                    <a
                                        key={i.id}
                                        href={`#${i.id}`}
                                        className={`block text-sm leading-snug hover:text-brand-700 ${i.level === 3 ? 'pl-3 text-muted-foreground' : ''}`}
                                    >
                                        {i.text}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    ) : null}
                </aside>
            </div>

            {/* Prev / Next */}
            {(prev || next) && (
                <div className="mx-auto grid max-w-6xl gap-3 px-4 pb-12 sm:grid-cols-2 sm:px-6 md:px-8">
                    <NavCard kind="prev" slug={prev?.slug} title={prev?.title} />
                    <NavCard kind="next" slug={next?.slug} title={next?.title} />
                </div>
            )}

            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </section>
    );
}
