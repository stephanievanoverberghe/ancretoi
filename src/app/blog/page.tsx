// src/app/blog/page.tsx
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { PostModel } from '@/db/schemas';

export default async function BlogList() {
    await dbConnect();
    const posts = await PostModel.find({ status: 'published', deletedAt: null }).sort({ publishedAt: -1 }).select({ title: 1, slug: 1, summary: 1, publishedAt: 1, _id: 0 }).lean();

    return (
        <div className="mx-auto max-w-4xl space-y-4 py-16 sm:py-20 lg:py-24">
            <h1 className="font-serif text-3xl">Blog</h1>

            {posts.map((p) => (
                <article key={p.slug} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <Link className="text-lg font-semibold underline decoration-brand-300 underline-offset-4 hover:decoration-brand-500" href={`/blog/${p.slug}`}>
                        {p.title}
                    </Link>
                    {p.publishedAt && <div className="mt-1 text-xs text-muted-foreground">{new Date(p.publishedAt).toLocaleDateString('fr-FR')}</div>}
                    {p.summary && <p className="mt-2 text-sm text-muted-foreground">{p.summary}</p>}
                </article>
            ))}

            {!posts.length && <p className="text-muted-foreground">Aucun article publié pour l’instant.</p>}
        </div>
    );
}
