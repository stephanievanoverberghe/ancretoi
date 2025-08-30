import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';
import State from '@/models/State';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const zUrlOrPath = z
    .string()
    .trim()
    .min(1)
    .regex(/^(\/|https?:\/\/)/, 'Doit commencer par / (public) ou http(s)://');
const zNullableCents = z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().min(0).nullable());
const zBooleanLike = z.preprocess((v) => {
    if (typeof v === 'string') {
        const s = v.toLowerCase();
        if (['true', '1', 'on', 'yes'].includes(s)) return true;
        if (['false', '0', 'off', 'no'].includes(s)) return false;
    }
    return v;
}, z.boolean().default(true));

/* ✅ payload admin */
const zPayload = z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    status: z.enum(['draft', 'preflight', 'published']).default('draft'),
    durationDays: z.coerce.number().int().min(1).max(365).default(7),
    estMinutesPerDay: z.coerce.number().int().min(1).max(180).default(20),
    level: z.enum(['Basique', 'Cible', 'Premium']).default('Basique'),
    category: z.string().default('wellbeing'),
    tags: z.array(z.string()).optional().default([]),

    heroImageUrl: zUrlOrPath.optional(),
    heroImageAlt: z.string().optional(),
    cardImageUrl: zUrlOrPath.optional(),
    cardImageAlt: z.string().optional(),
    cardTagline: z.string().optional(),
    cardSummary: z.string().optional(),
    accentColor: z.string().optional(),

    // ✅ champs comparateur (facultatifs)
    objectif: z.string().optional(),
    charge: z.string().optional(),
    ideal_si: z.string().optional(),
    cta: z.string().optional(),

    amountCents: zNullableCents.optional(),
    currency: z.string().length(3).default('EUR'),
    taxIncluded: zBooleanLike.optional().default(true),
    compareAtCents: zNullableCents.optional(),
    stripePriceId: z.preprocess((v) => (v === '' ? null : v), z.string().nullable()).optional(),
});

function slugify(input: string) {
    return input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function getProp(obj: unknown, key: string): unknown {
    return isObject(obj) ? obj[key] : undefined;
}
function coerceTags(value: unknown): string[] | undefined {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string')
        return value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    return undefined;
}

export async function GET(req: Request) {
    await requireAdmin();
    return NextResponse.redirect(new URL('/admin/programs/new', req.url), 302);
}

export async function POST(req: Request) {
    await requireAdmin();
    await dbConnect();

    const ct = req.headers.get('content-type') ?? '';
    const accept = req.headers.get('accept') ?? '';

    let raw: unknown;
    if (ct.includes('application/json')) raw = await req.json();
    else {
        const fd = await req.formData();
        const obj: Record<string, string> = {};
        for (const [k, v] of fd.entries()) obj[k] = typeof v === 'string' ? v : String(v);
        raw = obj;
    }

    const base: Record<string, unknown> = isObject(raw) ? raw : {};
    const tags = coerceTags(getProp(raw, 'tags'));

    // clean champs vides
    for (const k of [
        'heroImageUrl',
        'cardImageUrl',
        'heroImageAlt',
        'cardImageAlt',
        'cardTagline',
        'cardSummary',
        'accentColor',
        'amountCents',
        'compareAtCents',
        'stripePriceId',
        'objectif',
        'charge',
        'ideal_si',
        'cta',
    ]) {
        const v = base[k];
        if (typeof v === 'string' && v.trim() === '') delete base[k];
    }

    const data = zPayload.parse({ ...base, ...(tags ? { tags } : {}) });
    const programSlug = slugify(data.slug);

    const doc = await ProgramPage.findOneAndUpdate(
        { programSlug },
        {
            $setOnInsert: { programSlug },
            $set: {
                status: data.status,
                'hero.title': data.title,
                'hero.heroImage': data.heroImageUrl ? { url: data.heroImageUrl, alt: data.heroImageAlt ?? '' } : undefined,
                card: {
                    image: data.cardImageUrl ? { url: data.cardImageUrl, alt: data.cardImageAlt ?? '' } : undefined,
                    tagline: data.cardTagline,
                    summary: data.cardSummary,
                    accentColor: data.accentColor,
                    badges: [`${data.durationDays} jours`, data.level].filter(Boolean),
                },
                meta: {
                    durationDays: data.durationDays,
                    estMinutesPerDay: data.estMinutesPerDay,
                    level: data.level, // Basique | Cible | Premium
                    category: data.category,
                    tags: data.tags ?? [],
                    language: 'fr',
                },
                // ✅ sous-document compare
                compare: {
                    objectif: data.objectif ?? '',
                    charge: data.charge ?? '',
                    idealSi: data.ideal_si ?? '',
                    ctaLabel: data.cta ?? '',
                },
                price: {
                    amountCents: data.amountCents ?? null,
                    currency: (data.currency ?? 'EUR').toUpperCase(),
                    taxIncluded: data.taxIncluded ?? true,
                    compareAtCents: data.compareAtCents ?? null,
                    stripePriceId: data.stripePriceId ?? null,
                },
            },
        },
        { new: true, upsert: true }
    ).lean();

    if (accept.includes('text/html')) return NextResponse.redirect(new URL(`/admin/programs/${programSlug}/page`, req.url), 303);
    return NextResponse.json({ ok: true, page: doc });
}

export async function DELETE(req: Request) {
    await requireAdmin();
    await dbConnect();

    const url = new URL(req.url);
    const slug = (url.searchParams.get('slug') || '').toLowerCase();
    const dryRun = url.searchParams.get('dryRun') === 'true';
    if (!slug) return NextResponse.json({ error: 'missing_slug' }, { status: 400 });

    const session = await mongoose.startSession();
    let counts = { programPage: 0, units: 0, states: 0 };

    try {
        await session.withTransaction(async () => {
            const units = await Unit.find({ programSlug: slug }, { _id: 1 }).session(session);
            const unitIds = units.map((u) => u._id);

            if (!dryRun) {
                const statesDel = await State.deleteMany({ unitId: { $in: unitIds } }).session(session);
                const unitsDel = await Unit.deleteMany({ programSlug: slug }).session(session);
                const pageDel = await ProgramPage.deleteOne({ programSlug: slug }).session(session);

                counts.states = statesDel.deletedCount ?? 0;
                counts.units = unitsDel.deletedCount ?? 0;
                counts.programPage = pageDel.deletedCount ?? 0;
            } else {
                counts = {
                    programPage: await ProgramPage.countDocuments({ programSlug: slug }).session(session),
                    units: await Unit.countDocuments({ programSlug: slug }).session(session),
                    states: await State.countDocuments({ unitId: { $in: unitIds } }).session(session),
                };
            }
        });

        return NextResponse.json({ ok: true, dryRun, deleted: counts });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'delete_failed' }, { status: 500 });
    } finally {
        session.endSession();
    }
}
