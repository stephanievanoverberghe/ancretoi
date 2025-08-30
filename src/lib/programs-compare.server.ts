// src/lib/programs-compare.server.ts
import 'server-only';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';

type PgLean = {
    programSlug: string;
    status: 'draft' | 'preflight' | 'published';
    hero?: { title?: string | null } | null;
    card?: { tagline?: string | null; summary?: string | null } | null;
    meta?: { durationDays?: number | null; level?: 'Basique' | 'Cible' | 'Premium' | null; estMinutesPerDay?: number | null } | null;
    compare?: { objectif?: string | null; charge?: string | null; idealSi?: string | null; ctaLabel?: string | null } | null;
};

export type CompareRow = {
    slug: string;
    title: string;
    objectif: string;
    duree: string;
    charge: string;
    niveau: 'Basique' | 'Cible' | 'Premium' | (string & {});
    ideal_si: string;
    cta: string;
    status: 'draft' | 'preflight' | 'published';
};

function minutesToLabel(min?: number | null) {
    if (!min) return '—';
    if (min <= 20) return '10–20 min/j';
    if (min <= 40) return '20–40 min/j';
    return '40–60 min/j';
}

export async function getCompareRows(includeUnpublished = true): Promise<CompareRow[]> {
    await dbConnect();
    const query = includeUnpublished ? {} : { status: 'published' };
    const docs = await ProgramPage.find(query, { programSlug: 1, status: 1, hero: 1, card: 1, meta: 1, compare: 1, _id: 0 })
        .sort({ 'meta.durationDays': 1, createdAt: 1 })
        .lean<PgLean[]>()
        .exec();

    return docs.map((d) => {
        const slug = d.programSlug;
        const title = d.hero?.title?.trim() || slug.toUpperCase();
        const days = d.meta?.durationDays ?? 0;
        const duree = days ? `${days} jours` : '—';
        const niveau = (d.meta?.level ?? 'Basique') as CompareRow['niveau'];
        const objectif = d.compare?.objectif?.trim() || d.card?.tagline?.trim() || d.card?.summary?.trim() || `Parcours ${duree}`;
        const charge = d.compare?.charge?.trim() || minutesToLabel(d.meta?.estMinutesPerDay);
        const ideal_si = d.compare?.idealSi?.trim() || d.card?.summary?.trim() || d.card?.tagline?.trim() || '';
        const cta = d.compare?.ctaLabel?.trim() || `Voir ${title.toUpperCase()}`;
        return { slug, title, objectif, duree, charge, niveau, ideal_si, cta, status: d.status };
    });
}

/** Petit helper pour le Hero (étiquette “charge/jour” d’un slug) */
export async function getChargeLabel(slug: string): Promise<string | null> {
    await dbConnect();
    const d = await ProgramPage.findOne({ programSlug: slug }, { compare: 1, 'meta.estMinutesPerDay': 1, _id: 0 }).lean<PgLean | null>();
    if (!d) return null;
    return d.compare?.charge?.trim() || minutesToLabel(d.meta?.estMinutesPerDay);
}
