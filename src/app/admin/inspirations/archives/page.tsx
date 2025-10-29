// src/app/admin/inspirations/archives/page.tsx
import 'server-only';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { InspirationModel } from '@/db/schemas';
import AdminInspirationsArchivedGrid from './components/AdminInspirationsArchivedGrid';

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
    deletedAt?: Date | string | null;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function InspirationsArchivesPage() {
    await requireAdmin();
    await dbConnect();

    const docs = await InspirationModel.find({ deletedAt: { $ne: null } })
        .select({ title: 1, slug: 1, status: 1, videoUrl: 1, summary: 1, tags: 1, createdAt: 1, updatedAt: 1, deletedAt: 1 })
        .sort({ deletedAt: -1 })
        .lean<InspLean[]>();

    const rows = docs.map((d) => ({
        id: String(d._id),
        slug: d.slug,
        status: d.status as 'draft' | 'published',
        title: (d.title ?? '').trim() || 'Sans titre',
        videoUrl: d.videoUrl ?? null,
        summary: d.summary ?? null,
        tags: Array.isArray(d.tags) ? d.tags.filter(Boolean) : [],
        timestamps: {
            createdAt: d.createdAt ? new Date(d.createdAt as string | Date).toISOString() : null,
            updatedAt: d.updatedAt ? new Date(d.updatedAt as string | Date).toISOString() : null,
            deletedAt: d.deletedAt ? new Date(d.deletedAt as string | Date).toISOString() : null,
        },
    }));

    return (
        <div className="relative">
            {/* Header */}
            <div className="sticky top-[env(safe-area-inset-top,0px)] z-10 mb-4 -mx-4 bg-gradient-to-b from-background/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:-mx-6 md:-mx-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Archives — Inspirations</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">Éléments supprimés (soft delete). Tu peux les restaurer.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/inspirations" className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
                            ← Retour actives
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-0 sm:px-2 md:px-4">
                <AdminInspirationsArchivedGrid rows={rows} />
            </div>
        </div>
    );
}
