import 'server-only';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import type { Program, Price, ProgramDetail } from '@/lib/programs-index';

type PgLean = {
    programSlug: string;
    status: 'draft' | 'preflight' | 'published';
    hero?: { title?: string | null; heroImage?: { url?: string | null } | null } | null;
    card?: { image?: { url?: string | null; alt?: string | null } | null; tagline?: string | null; summary?: string | null } | null;
    meta?: { durationDays?: number | null; level?: 'Basique' | 'Cible' | 'Premium' | null } | null; // ⬅️ level
    price?: { amountCents?: number | null; currency?: string | null; taxIncluded?: boolean | null; compareAtCents?: number | null; stripePriceId?: string | null } | null;
};

function mapPrice(p?: PgLean['price']): Price {
    return {
        amount_cents: p?.amountCents ?? null,
        currency: (p?.currency ?? 'EUR') as Price['currency'],
        tax_included: p?.taxIncluded ?? true,
        compare_at_cents: p?.compareAtCents ?? null,
        stripe_price_id: p?.stripePriceId ?? null,
    };
}

function emptyDetail(): ProgramDetail {
    return { who: '', goals: [], includes: [], prerequisites: [], outcomes: [], faq: [] };
}

function mapDocToProgram(d: PgLean): Program {
    return {
        slug: d.programSlug,
        title: d.hero?.title?.trim() || d.programSlug,
        tagline: d.card?.tagline?.trim() || d.card?.summary?.trim() || '',
        duration_days: d.meta?.durationDays ?? 0,
        level: (d.meta?.level as Program['level']) || 'Basique', // ⬅️ on alimente le niveau
        status: d.status === 'published' ? 'published' : 'draft',
        cover: d.card?.image?.url || d.hero?.heroImage?.url || '',
        price: mapPrice(d.price),
        card_highlights: [],
        detail: emptyDetail(),
    };
}

export async function getPrograms(): Promise<Program[]> {
    await dbConnect();
    const docs = await ProgramPage.find({ status: { $in: ['published'] } }, { programSlug: 1, status: 1, hero: 1, card: 1, meta: 1, price: 1, _id: 0 })
        .sort({ 'meta.durationDays': 1, createdAt: -1 })
        .lean<PgLean[]>()
        .exec();

    return docs.map(mapDocToProgram);
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
    await dbConnect();
    const d = await ProgramPage.findOne(
        { programSlug: slug, status: { $in: ['published'] } },
        { programSlug: 1, status: 1, hero: 1, card: 1, meta: 1, price: 1, _id: 0 }
    ).lean<PgLean | null>();

    return d ? mapDocToProgram(d) : null;
}
