// src/app/admin/blog/categories/page.tsx

import 'server-only';
import Link from 'next/link';
import { Types } from 'mongoose';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { CategoryModel, PostModel, type ICategory } from '@/db/schemas';
import AdminCategoriesGridClient, { type AdminCategoryRow } from './components/AdminCategoriesGridClient';

type CategoryLean = Pick<ICategory, '_id' | 'name' | 'slug' | 'description' | 'color' | 'icon' | 'imagePath' | 'imageAlt' | 'createdAt' | 'updatedAt'>;

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AdminCategoriesPage() {
    await requireAdmin();
    await dbConnect();

    // Récupère toutes les catégories (pas d'archives côté catégories)
    const cats = await CategoryModel.find({})
        .select({ name: 1, slug: 1, description: 1, color: 1, icon: 1, imagePath: 1, imageAlt: 1, createdAt: 1, updatedAt: 1 })
        .sort({ name: 1 })
        .lean<CategoryLean[]>();

    // Compte des articles par catégorie (les posts gardent leur soft delete)
    const postsAgg = await PostModel.aggregate<{ _id: Types.ObjectId | null; count: number }>([
        { $match: { deletedAt: null } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);

    const postCountByCat = new Map<string, number>();
    for (const row of postsAgg) {
        if (row._id) postCountByCat.set(String(row._id), row.count);
    }

    const rows: AdminCategoryRow[] = cats.map((c) => ({
        id: String(c._id),
        name: c.name,
        slug: c.slug,
        description: c.description ?? '',
        color: c.color ?? null,
        icon: c.icon ?? null,
        imagePath: c.imagePath ?? null,
        imageAlt: c.imageAlt ?? null,
        usage: { posts: postCountByCat.get(String(c._id)) ?? 0 },
        timestamps: {
            createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
            updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
        },
    }));

    const stats = {
        total: rows.length,
        used: rows.filter((r) => r.usage.posts > 0).length,
        unused: rows.filter((r) => r.usage.posts === 0).length,
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <nav className="text-xs text-gray-500">
                            <Link href="/admin" className="hover:underline">
                                Admin
                            </Link>
                            <span className="px-1.5">›</span>
                            <Link href="/admin/blog/posts" className="hover:underline">
                                Blog
                            </Link>
                            <span className="px-1.5">›</span>
                            <span className="text-foreground">Catégories</span>
                        </nav>
                        <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Catégories</h1>
                        <p className="text-sm text-muted-foreground mt-1">Taxonomie du blog : création, édition, image & suppression (hard delete).</p>
                    </div>
                    <Link href="/admin/blog" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                        Retour blog
                    </Link>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Kpi label="Total" value={stats.total} />
                    <Kpi label="Utilisées" value={stats.used} />
                    <Kpi label="Inutilisées" value={stats.unused} />
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Link
                        href="/admin/blog/categories/new"
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        aria-label="Créer une catégorie"
                    >
                        <span aria-hidden className="text-xl leading-none">
                            ＋
                        </span>
                        <span className="hidden sm:inline">Nouvelle catégorie</span>
                    </Link>
                </div>
            </div>

            {/* Grid/Table (client) */}
            <div className="px-0 sm:px-2 md:px-0">
                <AdminCategoriesGridClient rows={rows} />
            </div>
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
