// SERVER COMPONENT — pas de "use client"
import 'server-only';
import ProgramsGridClient, { type Program } from './ProgramsGridClient';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';

export const revalidate = 60;

type PgLean = {
    programSlug: string;
    status: 'draft' | 'preflight' | 'published';
    hero?: {
        title?: string | null;
        heroImage?: { url?: string | null; alt?: string | null } | null;
    } | null;
    meta?: { durationDays?: number | null } | null;
    price?: { amountCents?: number | null; currency?: string | null } | null;
};

export default async function ProgramsGrid() {
    await dbConnect();

    const pages = await ProgramPage.find({}).select({ programSlug: 1, status: 1, hero: 1, meta: 1, price: 1 }).sort({ createdAt: 1 }).lean<PgLean[]>();

    const programs: Program[] = pages.map((p) => ({
        slug: p.programSlug,
        title: p.hero?.title ?? 'Sans titre',
        duration_days: p.meta?.durationDays ?? 7,
        status: p.status,
        image: p.hero?.heroImage?.url ? { src: p.hero.heroImage.url, alt: p.hero.heroImage.alt ?? '' } : null,
        // ✅ on passe bien le prix au client
        price: {
            amount_cents: p.price?.amountCents ?? null,
            currency: (p.price?.currency ?? 'EUR') as string,
        },
    }));

    return <ProgramsGridClient programs={programs} />;
}
