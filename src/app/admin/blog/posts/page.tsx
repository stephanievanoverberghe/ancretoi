// src/app/admin/blog/posts/page.tsx
import 'server-only';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { PostModel, CategoryModel } from '@/db/schemas';
import AdminPostsClient, { type AdminPostRow, type CategoryOption } from './components/AdminPostsGridClient';

type PostLean = {
    _id: unknown;
    slug: string;
    status: 'draft' | 'published';
    title?: string | null;
    coverPath?: string | null;
    summary?: string | null;
    tags?: string[] | null;
    category?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    isFeatured?: boolean;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
    publishedAt?: Date | string | null;
    deletedAt?: Date | string | null;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const iso = (d?: Date | string | null) => (d ? new Date(d).toISOString() : null);

export default async function AdminBlogPage() {
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
                seoTitle: 1,
                seoDescription: 1,
                isFeatured: 1,
                createdAt: 1,
                updatedAt: 1,
                publishedAt: 1,
            })
            .sort({ createdAt: -1 })
            .lean<PostLean[]>(),
        PostModel.countDocuments({ deletedAt: { $ne: null } }),
        CategoryModel.find({})
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
        category: d.category ?? null,
        timestamps: {
            createdAt: iso(d.createdAt),
            updatedAt: iso(d.updatedAt),
            publishedAt: iso(d.publishedAt),
        },
        seo: { title: d.seoTitle ?? '', description: d.seoDescription ?? '' },
        featured: !!d.isFeatured,
    }));

    const categories: CategoryOption[] = cats.map((c) => ({
        slug: c.slug,
        name: c.name,
        color: c.color || null,
        icon: c.icon || null,
    }));

    // KPIs alignés Users
    const stats = {
        total: rows.length,
        published: rows.filter((r) => r.status === 'published').length,
        draft: rows.filter((r) => r.status === 'draft').length,
        archived: archivedCount,
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header (même style que Users) */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="text-xs text-muted-foreground">
                    <Link href="/admin" className="hover:underline">
                        Admin
                    </Link>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">Articles</span>
                </div>
                <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Articles</h1>
                <p className="text-sm text-muted-foreground mt-1">Recherche, filtres, cartes & tableau, accès aux pages d’édition.</p>

                {/* KPIs compacts */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Kpi label="Total" value={stats.total} />
                    <Kpi label="Publiés" value={stats.published} />
                    <Kpi label="Brouillons" value={stats.draft} />
                    <Kpi label="Archivés" value={stats.archived} />
                </div>

                {/* Actions header */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Link href="/admin/blog/posts/archives" className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                        Archives ({archivedCount})
                    </Link>
                    <Link
                        href="/admin/blog/posts/new"
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
                        aria-label="Créer un nouvel article"
                    >
                        <span aria-hidden className="text-xl leading-none">
                            ＋
                        </span>
                        <span className="hidden sm:inline">Nouvel article</span>
                    </Link>
                </div>
            </div>

            {/* Client (grid/table + toolbar sticky) */}
            <AdminPostsClient rows={rows} categories={categories} />
        </div>
    );
}

function Kpi({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold">{value}</div>
        </div>
    );
}
