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

    return (
        <div className="relative">
            {/* Header sticky — bouton “Nouveau” visible sur TOUTES les tailles */}
            <div className="sticky top-[env(safe-area-inset-top,0px)] z-10 mb-4 -mx-4 bg-gradient-to-b from-background/80 to-transparent px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:-mx-6 md:-mx-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Programmes</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">Gère tes parcours, prix, statuts et contenus.</p>
                    </div>

                    {/* 👇 plus de `hidden sm:inline-flex` : visible aussi en mobile */}
                    <Link
                        href="/admin/programs/new"
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        aria-label="Créer un nouveau programme"
                    >
                        {/* Icône + toujours visible, texte caché sur mobile */}
                        <span aria-hidden className="text-xl leading-none">
                            ＋
                        </span>
                        <span className="hidden sm:inline">Nouveau</span>
                    </Link>
                </div>
            </div>

            {/* Grid + contrôles (client) */}
            <div className="mx-auto max-w-7xl px-0 sm:px-2 md:px-4">
                <AdminProgramsGridClient rows={rows} />
            </div>
        </div>
    );
}
