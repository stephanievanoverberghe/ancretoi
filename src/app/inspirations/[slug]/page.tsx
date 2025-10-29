// src/app/inspirations/[slug]/page.tsx
import 'server-only';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { dbConnect } from '@/db/connect';
import { InspirationModel } from '@/db/schemas';

type InspirationDoc = {
    title: string;
    slug: string;
    videoUrl: string;
    summary?: string | null;
    tags?: string[] | null;
    createdAt?: Date | string;
};

type Params = { slug: string };
type MaybePromise<T> = T | Promise<T>;

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function youtubeId(url: string | undefined) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
        if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
        return null;
    } catch {
        return null;
    }
}
function youtubeThumb(url?: string) {
    const id = youtubeId(url ?? '');
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

async function getData(slug: string) {
    await dbConnect();
    const doc = await InspirationModel.findOne({
        slug,
        status: 'published',
        deletedAt: null,
    })
        .select({
            _id: 0,
            title: 1,
            slug: 1,
            videoUrl: 1,
            summary: 1,
            tags: 1,
            createdAt: 1,
        })
        .lean<InspirationDoc | null>();

    if (!doc) return { doc: null, related: [] as InspirationDoc[] };

    // “Related” (mêmes tags ou dernières publiées)
    const related = await InspirationModel.find({
        status: 'published',
        deletedAt: null,
        slug: { $ne: slug },
        ...(doc.tags?.length ? { tags: { $in: doc.tags.slice(0, 3) } } : {}),
    })
        .sort({ createdAt: -1 })
        .limit(6)
        .select({
            _id: 0,
            title: 1,
            slug: 1,
            videoUrl: 1,
            summary: 1,
            tags: 1,
            createdAt: 1,
        })
        .lean<InspirationDoc[]>();

    return { doc, related };
}

// SEO dynamique — params peut être un Promise en Next 15
export async function generateMetadata({ params }: { params: MaybePromise<Params> }): Promise<Metadata> {
    const { slug } = await params;
    const { doc } = await getData(slug);
    if (!doc) return {};

    const img = youtubeThumb(doc.videoUrl) ?? undefined;
    const desc = doc.summary ?? 'Vidéo inspirante sélectionnée par Ancre-toi.';
    const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/inspirations/${doc.slug}`;

    return {
        title: `${doc.title} — Inspirations`,
        description: desc,
        alternates: { canonical: url },
        openGraph: {
            type: 'article',
            url,
            title: doc.title,
            description: desc,
            images: img ? [{ url: img }] : undefined,
        },
        twitter: {
            card: img ? 'summary_large_image' : 'summary',
            title: doc.title,
            description: desc,
            images: img ? [img] : undefined,
        },
    };
}

// Page — même ajustement: await params
export default async function InspirationDetailPage({ params }: { params: MaybePromise<Params> }) {
    const { slug } = await params;
    const { doc, related } = await getData(slug);
    if (!doc) notFound();

    const id = youtubeId(doc.videoUrl);
    const thumb = youtubeThumb(doc.videoUrl);

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            {/* Hero */}
            <section className="relative isolate overflow-hidden rounded-3xl border border-brand-200 bg-white ring-1 ring-white/40 shadow-sm">
                <div
                    aria-hidden
                    className="absolute inset-0 -z-10"
                    style={{
                        backgroundImage: thumb ? `url(${thumb})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: thumb ? 'saturate(105%) contrast(102%)' : undefined,
                    }}
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/92 via-white/70 to-white/20" />
                <div className="px-5 sm:px-8 md:px-10 py-8 sm:py-12 md:py-14">
                    <div className="max-w-3xl">
                        <h1 className="font-serif text-[clamp(1.6rem,5vw,2.4rem)] leading-tight tracking-tight">{doc.title}</h1>
                        {doc.summary && <p className="mt-2 text-[15px] sm:text-base text-muted-foreground">{doc.summary}</p>}
                        {!!doc.tags?.length && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {doc.tags.slice(0, 8).map((t) => (
                                    <span key={t} className="rounded-full bg-brand-50 text-brand-800 ring-1 ring-brand-100 px-2 py-0.5 text-[11px] font-medium">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Player */}
            <div className="mt-8 rounded-2xl overflow-hidden border border-brand-200 shadow-sm bg-black aspect-video">
                {id ? (
                    <iframe
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/${id}?rel=0`}
                        title={doc.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    />
                ) : (
                    <div className="grid h-full place-items-center text-white/70">Vidéo indisponible</div>
                )}
            </div>

            {/* Related */}
            {related.length ? (
                <section className="mt-10">
                    <h2 className="mb-4 font-semibold">D’autres inspirations</h2>
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map((it) => {
                            const th = youtubeThumb(it.videoUrl);
                            return (
                                <li key={it.slug}>
                                    <a
                                        href={`/inspirations/${it.slug}`}
                                        className="group block overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
                                    >
                                        <div className="relative aspect-video bg-gray-100">
                                            {th ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={th}
                                                    alt={it.title}
                                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            ) : null}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                                            <div className="absolute bottom-3 left-4 right-4 text-white drop-shadow-sm">
                                                <div className="font-semibold leading-snug text-base line-clamp-2">{it.title}</div>
                                            </div>
                                        </div>
                                        <div className="p-4">{it.summary && <p className="text-sm text-muted-foreground line-clamp-2">{it.summary}</p>}</div>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ) : null}
        </div>
    );
}
