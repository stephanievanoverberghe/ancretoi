// src/app/admin/programs/page.tsx
import 'server-only';
import Link from 'next/link';
import Image from 'next/image';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';
import DeleteProgramButton from '@/components/admin/DeleteProgramButton';

type Row = {
    programSlug: string;
    status: 'draft' | 'preflight' | 'published';
    hero?: { title?: string | null } | null;
    card?: { image?: { url?: string | null; alt?: string | null } | null } | null;
    price?: { amountCents?: number | null; currency?: string | null } | null;
    unitsCount: number;
};

// Shape minimal qu’on lit via .lean()
type PgLean = {
    programSlug: string;
    status: 'draft' | 'preflight' | 'published';
    hero?: { title?: string | null } | null;
    card?: { image?: { url?: string | null; alt?: string | null } | null } | null;
    price?: { amountCents?: number | null; currency?: string | null } | null;
};

function formatPrice(p?: Row['price']) {
    if (!p || p.amountCents == null) return 'Bientôt';
    try {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: (p.currency ?? 'EUR').toUpperCase() }).format(p.amountCents / 100);
    } catch {
        return `${(p.amountCents / 100).toFixed(2)} ${(p.currency ?? 'EUR').toUpperCase()}`;
    }
}

export default async function ProgramsListPage() {
    await requireAdmin();
    await dbConnect();

    const pages = await ProgramPage.find().select({ programSlug: 1, status: 1, hero: 1, card: 1, price: 1 }).sort({ createdAt: -1 }).lean<PgLean[]>();

    const rows: Row[] = await Promise.all(
        pages.map(async (p) => {
            const unitsCount = await Unit.countDocuments({ programSlug: p.programSlug, unitType: 'day' });
            return {
                programSlug: p.programSlug,
                status: p.status,
                hero: p.hero ?? undefined,
                card: p.card ?? undefined,
                price: p.price ?? undefined,
                unitsCount,
            };
        })
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Programmes</h2>
                <Link href="/admin/programs/new" className="rounded-lg border px-3 py-2 text-sm hover:bg-brand-50">
                    + Nouveau
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((r) => (
                    <div key={r.programSlug} className="rounded-xl border p-4 bg-white">
                        {r.card?.image?.url ? (
                            <div className="relative w-full h-36 overflow-hidden rounded-lg">
                                <Image
                                    src={r.card.image.url}
                                    alt={r.card.image.alt ?? ''}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 320px"
                                />
                            </div>
                        ) : null}

                        <div className="mt-3">
                            <div className="text-xs text-muted-foreground">{r.programSlug}</div>
                            <div className="text-lg font-semibold">{r.hero?.title ?? 'Sans titre'}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                                {r.status} • {r.unitsCount} unité{r.unitsCount > 1 ? 's' : ''} • {formatPrice(r.price)}
                            </div>

                            <div className="mt-3 flex gap-3 flex-wrap">
                                <Link href={`/admin/programs/${r.programSlug}/units`} className="text-brand-700 hover:underline">
                                    Jours
                                </Link>
                                <Link href={`/admin/programs/${r.programSlug}/page`} className="text-brand-700 hover:underline">
                                    Landing
                                </Link>
                                {/* ✅ Lien édition des métadonnées */}
                                <Link href={`/admin/programs/${r.programSlug}/edit`} className="text-brand-700 hover:underline">
                                    Éditer
                                </Link>
                                <DeleteProgramButton slug={r.programSlug} />
                            </div>
                        </div>
                    </div>
                ))}
                {!rows.length && <div className="rounded-xl border p-8 text-center text-muted-foreground">Aucun programme pour le moment.</div>}
            </div>
        </div>
    );
}
