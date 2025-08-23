// src/app/blog/page.tsx
import { dbConnect } from '@/db/connect';
import { PostModel } from '@/db/schemas';

export default async function BlogList() {
    await dbConnect();
    const posts = await PostModel.find({ status: 'published', deletedAt: null }).sort({ publishedAt: -1 }).select({ title: 1, slug: 1, summary: 1, publishedAt: 1, _id: 0 }).lean();

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <h1 className="font-serif text-3xl">Blog</h1>
            {posts.map((p) => (
                <article key={p.slug} className="card p-4">
                    <a className="text-lg font-semibold underline" href={`/blog/${p.slug}`}>
                        {p.title}
                    </a>
                    {p.publishedAt && <div className="text-xs text-muted-foreground mt-1">{new Date(p.publishedAt).toLocaleDateString('fr-FR')}</div>}
                    {p.summary && <p className="mt-2 text-sm text-muted-foreground">{p.summary}</p>}
                </article>
            ))}
            {!posts.length && <p className="text-muted-foreground">Aucun article publié pour l’instant.</p>}
        </div>
    );
}
