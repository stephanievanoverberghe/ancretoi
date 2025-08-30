// SERVER COMPONENT
import 'server-only';
import CollectionsGrid from './CollectionsGridClient';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import type { ProgramCardProgram } from '@/components/programs/cards/ProgramCard';

export const revalidate = 60;

type PgLean = {
    programSlug: string;
    status: 'draft' | 'preflight' | 'published';
    hero?: { title?: string | null; heroImage?: { url?: string | null; alt?: string | null } | null } | null;
    card?: { image?: { url?: string | null; alt?: string | null } | null } | null;
    meta?: { durationDays?: number | null } | null;
    price?: { amountCents?: number | null; currency?: string | null } | null;
};

export default async function CollectionsGridServer() {
    await dbConnect();

    // ⬇️ on ne filtre pas par statut → on récupère published + preflight + draft
    const pages = await ProgramPage.find({})
        .select({ programSlug: 1, status: 1, hero: 1, card: 1, meta: 1, price: 1 })
        .sort({ 'meta.durationDays': 1, createdAt: -1 })
        .lean<PgLean[]>();

    // Mappage dans la forme attendue par ProgramCard
    const programs: ProgramCardProgram[] = pages.map((p) => ({
        slug: p.programSlug,
        title: p.hero?.title ?? 'Sans titre',
        duration_days: p.meta?.durationDays ?? 7,
        status: p.status, // draft | preflight | published
        cover: p.card?.image?.url ?? p.hero?.heroImage?.url ?? null,
        price: {
            amount_cents: p.price?.amountCents ?? null,
            currency: (p.price?.currency ?? 'EUR') as string,
        },
    }));

    // Optionnel: published → preflight → draft
    const order: Record<string, number> = { published: 0, preflight: 1, draft: 2 };
    programs.sort((a, b) => (order[a.status ?? ''] ?? 99) - (order[b.status ?? ''] ?? 99) || (a.duration_days || 0) - (b.duration_days || 0));

    return <CollectionsGrid programs={programs} />;
}
