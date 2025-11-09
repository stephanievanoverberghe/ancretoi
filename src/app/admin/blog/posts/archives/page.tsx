// / /src/app/admin/blog/posts/archives/page.tsx
import 'server-only';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { PostModel } from '@/db/schemas';
import AdminPostsArchivedGrid from './components/AdminPostsArchivedGrid';
import { PATHS } from '@/lib/paths';

type PostLean = {
    _id: unknown;
    title?: string | null;
    slug: string;
    status: 'draft' | 'published';
    coverPath?: string | null;
    summary?: string | null;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
    deletedAt?: Date | string | null;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function BlogArchivesPage() {
    await requireAdmin();
    await dbConnect();

    const docs = await PostModel.find({ deletedAt: { $ne: null } })
        .select({ title: 1, slug: 1, status: 1, coverPath: 1, summary: 1, createdAt: 1, updatedAt: 1, deletedAt: 1 })
        .sort({ deletedAt: -1 })
        .lean<PostLean[]>();

    const rows = docs.map((d) => ({
        id: String(d._id),
        slug: d.slug,
        status: d.status as 'draft' | 'published',
        title: (d.title ?? '').trim() || 'Sans titre',
        coverPath: d.coverPath ?? null,
        summary: d.summary ?? null,
        timestamps: {
            createdAt: d.createdAt ? new Date(d.createdAt as string | Date).toISOString() : null,
            updatedAt: d.updatedAt ? new Date(d.updatedAt as string | Date).toISOString() : null,
            deletedAt: d.deletedAt ? new Date(d.deletedAt as string | Date).toISOString() : null,
        },
    }));

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-violet-200/40 bg-gradient-to-br from-violet-600/10 via-violet-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <nav className="text-xs text-gray-500">
                            <Link href={PATHS.adminBlog} className="hover:underline">
                                Admin
                            </Link>
                            <span className="px-1.5">›</span>
                            <Link href={PATHS.adminBlogPosts} className="hover:underline">
                                Articles
                            </Link>
                            <span className="px-1.5">›</span>
                            <span className="text-foreground">Archives</span>
                        </nav>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold text-slate-900">Archives — Articles</h1>
                        <p className="text-sm text-gray-600 mt-1">Billets supprimés (soft delete). Tu peux les restaurer ou les supprimer définitivement.</p>
                    </div>
                    <Link href={PATHS.adminBlogPosts} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                        Retour liste
                    </Link>
                </div>
            </div>

            <AdminPostsArchivedGrid rows={rows} />
        </div>
    );
}
