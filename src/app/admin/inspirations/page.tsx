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

    return (
        <div className="relative">
            {/* Header sticky */}
            <div className="sticky top-[env(safe-area-inset-top,0px)] z-10 mb-4 -mx-4 bg-gradient-to-b from-background/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:-mx-6 md:-mx-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Inspirations</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">Collecte, édite, publie tes vidéos d’inspiration.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/inspirations/archives" className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                            Archives ({archivedCount})
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
            </div>

            {/* Grid */}
            <div className="mx-auto max-w-7xl px-0 sm:px-2 md:px-4">
                <AdminInspirationsGridClient rows={rows} />
            </div>
        </div>
    );
}
