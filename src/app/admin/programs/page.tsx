// src/app/admin/programs/page.tsx
import 'server-only';
import Link from 'next/link';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';
import AdminProgramsGridClient, { type AdminProgramRow } from './components/AdminProgramsGridClient';

type PgLean = {
    programSlug: string;
    status: 'draft' | 'preflight' | 'published';
    hero?: { title?: string | null } | null;
    card?: { image?: { url?: string | null; alt?: string | null } | null } | null;
    price?: { amountCents?: number | null; currency?: string | null } | null;
    meta?: {
        durationDays?: number | null;
        estMinutesPerDay?: number | null;
        level?: 'Basique' | 'Cible' | 'Premium' | null;
        tags?: string[] | null;
    } | null;
    createdAt?: Date;
    updatedAt?: Date;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ProgramsListPage() {
    await requireAdmin();
    await dbConnect();

    const pages = await ProgramPage.find()
        .select({
            programSlug: 1,
            status: 1,
            hero: 1,
            card: 1,
            price: 1,
            meta: 1,
            createdAt: 1,
            updatedAt: 1,
        })
        .sort({ createdAt: -1 })
        .lean<PgLean[]>();

    const rows: AdminProgramRow[] = await Promise.all(
        pages.map(async (p) => {
            const unitsCount = await Unit.countDocuments({
                programSlug: p.programSlug,
                unitType: 'day',
            });
            return {
                programSlug: p.programSlug,
                status: p.status,
                title: p.hero?.title ?? 'Sans titre',
                coverUrl: p.card?.image?.url ?? null,
                coverAlt: p.card?.image?.alt ?? null,
                price: {
                    amountCents: p.price?.amountCents ?? null,
                    currency: (p.price?.currency ?? 'EUR')?.toUpperCase() as AdminProgramRow['price']['currency'],
                },
                meta: {
                    durationDays: p.meta?.durationDays ?? null,
                    estMinutesPerDay: p.meta?.estMinutesPerDay ?? null,
                    level: (p.meta?.level as AdminProgramRow['meta']['level']) ?? null,
                    tags: Array.isArray(p.meta?.tags) ? p.meta!.tags!.filter(Boolean) : [],
                },
                stats: { unitsCount },
                timestamps: {
                    createdAt: p.createdAt ? p.createdAt.toISOString() : null,
                    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
                },
            };
        })
    );

    const stats = {
        total: rows.length,
        published: rows.filter((r) => r.status === 'published').length,
        preflight: rows.filter((r) => r.status === 'preflight').length,
        draft: rows.filter((r) => r.status === 'draft').length,
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* ===== Header style "Utilisateurs / Inspirations" ===== */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-amber-400/10 p-5 md:p-6 ring-1 ring-black/5 backdrop-blur">
                <div className="text-xs text-muted-foreground">
                    <Link href="/admin" className="hover:underline">
                        Admin
                    </Link>
                    <span className="px-1.5">›</span>
                    <span className="text-foreground">Programmes</span>
                </div>
                <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">Programmes</h1>
                <p className="text-sm text-muted-foreground mt-1">Gère tes parcours, statuts, prix et contenus.</p>

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
                        <div className="text-xs text-muted-foreground">Pré-flight</div>
                        <div className="text-2xl font-semibold">{stats.preflight}</div>
                    </div>
                    <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-4">
                        <div className="text-xs text-muted-foreground">Brouillons</div>
                        <div className="text-2xl font-semibold">{stats.draft}</div>
                    </div>
                </div>

                {/* Actions à droite */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Link
                        href="/admin/programs/new"
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        aria-label="Créer un nouveau programme"
                    >
                        <span aria-hidden className="text-xl leading-none">
                            ＋
                        </span>
                        <span className="hidden sm:inline">Nouveau</span>
                    </Link>
                </div>
            </div>

            {/* ===== Grid + contrôles (client) ===== */}
            <div className="px-0 sm:px-2 md:px-0">
                <AdminProgramsGridClient rows={rows} />
            </div>
        </div>
    );
}
