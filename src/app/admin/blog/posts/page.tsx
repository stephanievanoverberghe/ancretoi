// src/app/admin/blog/page.tsx
import 'server-only';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { PostModel, CategoryModel } from '@/db/schemas';
import AdminPostsGridClient, { type AdminPostRow, type CategoryOption } from './new/components/AdminPostsGridClient';

type PostLean = {
    _id: unknown;
    title?: string | null;
    slug: string;
    status: 'draft' | 'published';
    coverPath: string | null;
    summary?: string | null;
    tags?: string[] | null;
    category?: string | null; // slug stocké dans Post.category
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
    publishedAt?: Date | string | null;
    deletedAt?: Date | string | null;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AdminBlogListPage() {
    await requireAdmin();
    await dbConnect();

    const [actives, archivedCount, cats] = await Promise.all([
        PostModel.find({ deletedAt: null })
            .select({
                title: 1,
                slug: 1,
                status: 1,
                coverPath: 1,
                summary: 1,
                tags: 1,
                category: 1,
                createdAt: 1,
                updatedAt: 1,
                publishedAt: 1,
            })
            .sort({ createdAt: -1 })
            .lean<PostLean[]>(),
        PostModel.countDocuments({ deletedAt: { $ne: null } }),
        CategoryModel.find({ deletedAt: null })
            .select({ name: 1, slug: 1, color: 1, icon: 1 })
            .sort({ name: 1 })
            .lean<{ name: string; slug: string; color?: string | null; icon?: string | null }[]>(),
    ]);

    const rows: AdminPostRow[] = actives.map((d) => ({
        id: String(d._id),
        slug: d.slug,
        status: d.status,
        title: (d.title ?? '').trim() || 'Sans titre',
        coverPath: d.coverPath ?? null,
        summary: d.summary ?? null,
        tags: Array.isArray(d.tags) ? d.tags : [],
        category: d.category ?? null, // slug (ou ancien nom libre)
        timestamps: {
            createdAt: d.createdAt ? new Date(d.createdAt as string | Date).toISOString() : null,
            updatedAt: d.updatedAt ? new Date(d.updatedAt as string | Date).toISOString() : null,
            publishedAt: d.publishedAt ? new Date(d.publishedAt as string | Date).toISOString() : null,
        },
    }));

    const categories: CategoryOption[] = cats.map((c) => ({
        slug: c.slug,
        name: c.name,
        color: c.color || null,
        icon: c.icon || null,
    }));

    const stats = {
        total: rows.length,
        published: rows.filter((r) => r.status === 'published').length,
        draft: rows.filter((r) => r.status === 'draft').length,
        archived: archivedCount,
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* ===== Header style "Inspirations" ===== */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <nav className="text-xs text-gray-500">
                            <Link href="/admin" className="hover:underline">
                                Admin
                            </Link>
                            <span className="px-1.5">›</span>
                            <Link href="/admin/blog" className="hover:underline">
                                Blog
                            </Link>
                            <span className="px-1.5">›</span>
                            <span className="text-foreground">Articles</span>
                        </nav>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Articles</h1>
                        <p className="text-sm text-muted-foreground mt-1">Rédaction, édition et publication des billets du blog.</p>
                    </div>
                    <Link href="/admin/blog" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                        Retour blog
                    </Link>
                </div>
                {/* Stats */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="text-2xl font-semibold">{stats.total}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Publiés</div>
                        <div className="text-2xl font-semibold">{stats.published}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Brouillons</div>
                        <div className="text-2xl font-semibold">{stats.draft}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Archivés</div>
                        <div className="text-2xl font-semibold">{stats.archived}</div>
                    </div>
                </div>

                {/* Actions (droite) */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Link href="/admin/blog/archives" className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                        Archives ({stats.archived})
                    </Link>
                    <Link
                        href="/admin/blog/new"
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        aria-label="Créer un nouvel article"
                    >
                        <span aria-hidden className="text-xl leading-none">
                            ＋
                        </span>
                        <span className="hidden sm:inline">Nouvel article</span>
                    </Link>
                </div>
            </div>

            {/* ===== Grid (client) ===== */}
            <div className="px-0 sm:px-2 md:px-0">
                <AdminPostsGridClient rows={rows} categories={categories} />
            </div>
        </div>
    );
}
