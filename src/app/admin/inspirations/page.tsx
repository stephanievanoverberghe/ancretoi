// src/app/admin/inspirations/page.tsx
import 'server-only';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { InspirationModel } from '@/db/schemas';
import AdminInspirationsGridClient, { type AdminInspirationRow } from './new/components/AdminInspirationsGridClient';

type InspLean = {
    _id: unknown;
    title?: string | null;
    slug: string;
    status: 'draft' | 'published';
    videoUrl?: string | null;
    summary?: string | null;
    tags?: string[] | null;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function InspirationsListPage() {
    await requireAdmin();
    await dbConnect();

    const [actives, archivedCount] = await Promise.all([
        InspirationModel.find({ deletedAt: null })
            .select({ title: 1, slug: 1, status: 1, videoUrl: 1, summary: 1, tags: 1, createdAt: 1, updatedAt: 1 })
            .sort({ createdAt: -1 })
            .lean<InspLean[]>(),
        InspirationModel.countDocuments({ deletedAt: { $ne: null } }),
    ]);

    const rows: AdminInspirationRow[] = actives.map((d) => ({
        id: String(d._id),
        slug: d.slug,
        status: d.status,
        title: (d.title ?? '').trim() || 'Sans titre',
        videoUrl: d.videoUrl ?? null,
        summary: d.summary ?? null,
        tags: Array.isArray(d.tags) ? d.tags.filter(Boolean) : [],
        timestamps: {
            createdAt: d.createdAt ? new Date(d.createdAt as string | Date).toISOString() : null,
            updatedAt: d.updatedAt ? new Date(d.updatedAt as string | Date).toISOString() : null,
        },
    }));

    const stats = {
        total: rows.length,
        published: rows.filter((r) => r.status === 'published').length,
        draft: rows.filter((r) => r.status === 'draft').length,
        archived: archivedCount,
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* ===== Header style "Utilisateurs" ===== */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="hidden md:block text-xs text-muted-foreground">
                    <Link href="/admin" className="hover:underline cursor-pointer">
                        Admin
                    </Link>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">Inspirations</span>
                </div>
                <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Inspirations</h1>
                <p className="text-sm text-muted-foreground mt-1">Collecte, édition et publication de tes vidéos d’inspiration.</p>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="text-2xl font-semibold">{stats.total}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Publiées</div>
                        <div className="text-2xl font-semibold">{stats.published}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Brouillons</div>
                        <div className="text-2xl font-semibold">{stats.draft}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Archivées</div>
                        <div className="text-2xl font-semibold">{stats.archived}</div>
                    </div>
                </div>

                {/* Actions (alignées à droite) */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Link href="/admin/inspirations/archives" className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                        Archives ({stats.archived})
                    </Link>
                    <Link
                        href="/admin/inspirations/new"
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        aria-label="Créer une nouvelle inspiration"
                    >
                        <span aria-hidden className="text-xl leading-none">
                            ＋
                        </span>
                        <span className="hidden sm:inline">Nouvelle</span>
                    </Link>
                </div>
            </div>

            {/* ===== Grid ===== */}
            <div className="px-0 sm:px-2 md:px-0">
                <AdminInspirationsGridClient rows={rows} />
            </div>
        </div>
    );
}
