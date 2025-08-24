import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

/* --------- Types --------- */
type Hero = { src: string; alt: string };
type Block =
    // Titres (2 façons supportées)
    | { type: 'heading'; level: 2 | 3; text: string }
    | { type: 'h2' | 'h3'; text: string }
    // Paragraphes (2 façons)
    | { type: 'paragraph' | 'p'; text: string }
    // Listes (2 façons)
    | { type: 'list'; style: 'unordered' | 'ordered' | 'ul' | 'ol'; items: string[] }
    // Image
    | { type: 'image'; src: string; alt: string; caption?: string; ratio?: string }
    // Citation
    | { type: 'quote'; text: string; cite?: string }
    // Encadré (supporte body ou text)
    | { type: 'callout'; title?: string; body?: string; text?: string; tone?: 'info' | 'note' | 'tip' }
    // Séparateur
    | { type: 'hr' };

type Post = {
    slug: string;
    title: string;
    date: string; // ISO
    excerpt: string;
    hero: Hero;
    content: Block[];
};

type PostModule = { default: unknown };

/* --------- Mapping JSON --------- */
const POSTS: Record<string, () => Promise<PostModule>> = {
    'rituel-matin-7-min': () => import('@/data/posts/rituel-matin-7-min.json'),
    'equilibre-limites-douces': () => import('@/data/posts/equilibre-limites-douces.json'),
    'ralentir-sans-procrastiner': () => import('@/data/posts/ralentir-sans-procrastiner.json'),
} as const;

/* --------- Helpers --------- */
function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function assertPostShape(p: unknown): asserts p is Post {
    if (!isRecord(p)) throw new Error('Invalid post JSON');
    if (typeof p.slug !== 'string') throw new Error('Invalid post: slug');
    if (typeof p.title !== 'string') throw new Error('Invalid post: title');
    if (typeof p.excerpt !== 'string') throw new Error('Invalid post: excerpt');
    if (!isRecord(p.hero) || typeof p.hero.src !== 'string' || typeof p.hero.alt !== 'string') {
        throw new Error('Invalid post: hero');
    }
    if (!Array.isArray(p.content)) throw new Error('Invalid post: content[]');
}

/* --------- SSG des 3 slugs --------- */
export function generateStaticParams() {
    return Object.keys(POSTS).map((slug) => ({ slug }));
}

async function loadPost(slug: string): Promise<Post> {
    const loader = POSTS[slug];
    if (!loader) notFound();
    const mod = await loader();
    assertPostShape((mod as PostModule).default);
    return (mod as { default: Post }).default;
}

/* --------- Metadata --------- */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params; // ✅ Next 15: params est une Promise
    const post = await loadPost(slug);
    return {
        title: `${post.title} — Ancre-toi`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: [{ url: post.hero.src, alt: post.hero.alt }],
            type: 'article',
        },
    };
}

export const revalidate = 3600;

/* --------- Rendu des blocs --------- */
function BlockRenderer({ b }: { b: Block }) {
    // Headings
    if (b.type === 'heading') {
        if (b.level === 2) return <h2 className="mt-8 mb-3 font-serif text-2xl">{b.text}</h2>;
        return <h3 className="mt-6 mb-2 font-serif text-xl">{b.text}</h3>;
    }
    if (b.type === 'h2') return <h2 className="mt-8 mb-3 font-serif text-2xl">{b.text}</h2>;
    if (b.type === 'h3') return <h3 className="mt-6 mb-2 font-serif text-xl">{b.text}</h3>;

    // Paragraphes
    if (b.type === 'paragraph' || b.type === 'p') {
        return <p className="mb-4 text-[15px] leading-relaxed text-brand-900">{b.text}</p>;
    }

    // Listes
    if (b.type === 'list') {
        const ordered = b.style === 'ordered' || b.style === 'ol';
        return ordered ? (
            <ol className="mb-4 list-decimal pl-5 text-[15px] text-brand-900 space-y-1">
                {b.items.map((it, i) => (
                    <li key={i}>{it}</li>
                ))}
            </ol>
        ) : (
            <ul className="mb-4 list-disc pl-5 text-[15px] text-brand-900 space-y-1">
                {b.items.map((it, i) => (
                    <li key={i}>{it}</li>
                ))}
            </ul>
        );
    }

    // Image
    if (b.type === 'image') {
        return (
            <figure className="my-6 overflow-hidden rounded-xl border border-border">
                <div className="relative aspect-[4/3] w-full">
                    <Image src={b.src} alt={b.alt} fill sizes="(max-width:768px) 100vw, 800px" className="object-cover" />
                </div>
                {'caption' in b && b.caption ? <figcaption className="px-3 py-2 text-center text-xs text-muted-foreground">{b.caption}</figcaption> : null}
            </figure>
        );
    }

    // Citation
    if (b.type === 'quote') {
        return (
            <blockquote className="my-6 rounded-xl border-l-4 border-brand-300 bg-brand-50/50 px-4 py-3 text-brand-900">
                <p className="italic">“{b.text}”</p>
                {b.cite && <footer className="mt-1 text-xs text-muted-foreground">— {b.cite}</footer>}
            </blockquote>
        );
    }

    // Encadré
    if (b.type === 'callout') {
        const body = b.body ?? b.text ?? '';
        return (
            <div className="my-6 rounded-xl border border-secondary-200 bg-secondary-50/50 px-4 py-3">
                {b.title && <div className="mb-1 font-medium">{b.title}</div>}
                <p className="text-[15px] text-brand-900">{body}</p>
            </div>
        );
    }

    // HR
    if (b.type === 'hr') return <hr className="my-8 border-t border-border/70" />;

    return null;
}

/* --------- Page --------- */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params; // ✅ Next 15
    const post = await loadPost(slug);

    return (
        <section className="relative mx-[calc(50%-50vw)] w-screen bg-white py-12 sm:py-16">
            {/* filets or */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold-100/70" aria-hidden />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold-100/70" aria-hidden />

            <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8">
                <nav className="mb-6">
                    <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-secondary-700 hover:text-secondary-900">
                        ← Tous les articles
                    </Link>
                </nav>

                <header className="mb-6">
                    <time dateTime={post.date} className="text-xs uppercase tracking-wide text-secondary-700">
                        {new Date(post.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </time>
                    <h1 className="mt-1 font-serif text-[clamp(1.5rem,3.8vw,2.2rem)] leading-tight">{post.title}</h1>
                    <p className="mt-2 text-[15px] text-muted-foreground">{post.excerpt}</p>
                </header>

                {/* Hero */}
                <figure className="mb-8 overflow-hidden rounded-2xl border border-brand-100">
                    <div className="relative aspect-[4/3] w-full">
                        <Image src={post.hero.src} alt={post.hero.alt} fill sizes="(max-width:768px) 100vw, 800px" className="object-cover" priority />
                    </div>
                </figure>

                {/* Contenu */}
                <article className="prose prose-neutral max-w-none prose-p:my-0 prose-headings:font-serif">
                    {post.content.map((b, i) => (
                        <BlockRenderer key={i} b={b as Block} />
                    ))}
                </article>

                {/* CTA bas d’article */}
                <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50/40 p-5 text-center">
                    <p className="text-[15px] text-brand-900">Envie d’aller plus loin en douceur ?</p>
                    <Link
                        href="/programs"
                        className="mt-3 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-[15px] font-medium text-white transition hover:bg-brand-700 active:translate-y-[1px]"
                    >
                        Découvrir les programmes
                    </Link>
                </div>
            </div>
        </section>
    );
}
