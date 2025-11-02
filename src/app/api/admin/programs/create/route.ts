// src/app/api/admin/programs/create/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { ProgramModel } from '@/db/schemas';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';

export const dynamic = 'force-dynamic';

/* ---- Validation ---- */
const zUrl = z.string().url();

const zBenefit = z.object({
    icon: z.string().optional(),
    title: z.string().min(1),
    text: z.string().min(1),
});

const zDay = z.object({
    title: z.string().min(1),
    videoUrl: zUrl, // requis
    mantra: z.string().max(120).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
});

const zPayload = z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    status: z.enum(['draft', 'preflight', 'published']).default('draft'),
    level: z.enum(['Basique', 'Cible', 'Premium']).default('Basique'),
    durationDays: z.coerce.number().int().min(1).max(365).default(7),
    estMinutesPerDay: z.coerce.number().int().min(1).max(180).default(20),
    priceCents: z.number().int().nullable().optional(),
    marketing: z.object({
        hero: z.object({
            title: z.string().min(1),
            subtitle: z.string().optional(),
            ctaHref: z.string().optional(),
            heroImage: z.string().optional(),
        }),
        objective: z.string().optional(),
        durationLabel: z.string().optional(),
        idealIf: z.string().optional(),
        benefits: z.array(zBenefit).max(3).default([]),
        faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).optional(),
        seo: z.object({ title: z.string().optional(), description: z.string().optional(), image: z.string().optional() }).partial().optional(),
    }),
    days: z.array(zDay).min(1),
});

function slugify(s: string) {
    return s
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function POST(req: Request) {
    await requireAdmin();
    await dbConnect();

    const raw = await req.json();
    const body = zPayload.parse(raw);
    const programSlug = slugify(body.slug);
    const session = await mongoose.startSession();

    try {
        let unitIds: mongoose.Types.ObjectId[] = [];
        await session.withTransaction(async () => {
            /* 1) Catalogue Program */
            await ProgramModel.findOneAndUpdate(
                { slug: programSlug },
                {
                    $setOnInsert: { slug: programSlug },
                    $set: {
                        title: body.title,
                        'meta.level': body.level,
                        status: body.status,
                        'stats.unitsCount': body.days.length,
                    },
                },
                { new: true, upsert: true, session }
            );

            /* 2) Page marketing */
            const hero = body.marketing.hero;
            const heroImgObj = hero.heroImage && hero.heroImage.trim() ? { url: hero.heroImage.trim(), alt: '' } : null;
            const durationBadge = body.marketing.durationLabel?.trim() || `${body.durationDays} jours • ${body.estMinutesPerDay} min/j`;
            const idealIfHighlight = body.marketing.idealIf?.trim() ? [{ icon: '✅', title: 'Idéal si…', text: body.marketing.idealIf.trim() }] : [];

            await ProgramPage.findOneAndUpdate(
                { programSlug },
                {
                    $setOnInsert: { programSlug },
                    $set: {
                        status: body.status,
                        hero: {
                            eyebrow: '',
                            title: hero.title || body.title,
                            subtitle: hero.subtitle || '',
                            ctaLabel: hero.ctaHref ? 'Commencer' : '',
                            ctaHref: hero.ctaHref || '',
                            heroImage: heroImgObj,
                        },
                        card: {
                            image: heroImgObj,
                            tagline: body.marketing.durationLabel || durationBadge,
                            summary: body.marketing.objective || '',
                            accentColor: '',
                            badges: [durationBadge, body.level],
                        },
                        meta: {
                            durationDays: body.durationDays,
                            estMinutesPerDay: body.estMinutesPerDay,
                            level: body.level,
                            category: 'wellbeing',
                            tags: [],
                            language: 'fr',
                        },
                        highlights: [...idealIfHighlight, ...(body.marketing.benefits || []).map((b) => ({ icon: b.icon || '', title: b.title, text: b.text }))],
                        curriculum: body.days.map((d) => ({ label: d.title, summary: '' })),
                        faq: body.marketing.faq || [],
                        seo: body.marketing.seo || {},
                        price: {
                            amountCents: body.priceCents ?? null,
                            currency: 'EUR',
                            taxIncluded: true,
                            compareAtCents: null,
                            stripePriceId: null,
                        },
                    },
                },
                { new: true, upsert: true, session }
            );

            /* 3) Units J1→Jn */
            await Unit.deleteMany({ programSlug }, { session });

            const created = await Unit.insertMany(
                body.days.map((d, i) => ({
                    programSlug,
                    unitType: 'day',
                    unitIndex: i + 1,
                    title: d.title,
                    durationMin: body.estMinutesPerDay,
                    mantra: d.mantra ?? '',
                    videoUrl: d.videoUrl,
                    contentParagraphs: d.description ? [d.description] : [],
                    status: d.status ?? (body.status === 'published' ? 'published' : 'draft'),
                })),
                { session }
            );

            unitIds = created.map((u) => u._id);
        });

        return NextResponse.json({ ok: true, programSlug, units: unitIds.length });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'create_failed';
        return NextResponse.json({ error: message }, { status: 400 });
    } finally {
        session.endSession();
    }
}
