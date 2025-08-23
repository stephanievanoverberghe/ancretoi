import Link from 'next/link';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { PostModel } from '@/db/schemas';

type PostListItem = {
    _id: string;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    publishedAt: Date | null;
    createdAt: Date;
};
type PostRaw = {
    _id: unknown;
    title: string;
    slug: string;
    status: 'draft' | 'published';
    publishedAt: string | Date | null;
    createdAt: string | Date;
};

export default async function BlogAdminList() {
    await requireAdmin();
    await dbConnect();

    const raw = await PostModel.find({ deletedAt: null }).select({ title: 1, slug: 1, status: 1, publishedAt: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean<PostRaw[]>();

    const posts: PostListItem[] = raw.map((a) => ({
        _id: String(a._id),
        title: a.title,
        slug: a.slug,
        status: a.status,
        publishedAt: a.publishedAt ? (a.publishedAt instanceof Date ? a.publishedAt : new Date(a.publishedAt)) : null,
        createdAt: a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt),
    }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Articles</h2>
                <Link href="/admin/blog/new" className="button">
                    Nouvel article
                </Link>
            </div>

            <div className="card p-4">
                {!posts.length ? (
                    <p className="text-muted-foreground">Aucun article.</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {posts.map((a) => (
                            <li key={a._id} className="py-3 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{a.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                        /{a.slug} • {a.status}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
