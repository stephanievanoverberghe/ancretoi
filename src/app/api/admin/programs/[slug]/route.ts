// src/app/api/admin/programs/[slug]/route.ts

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { ProgramModel } from '@/db/schemas';
import ProgramPage from '@/models/ProgramPage';
import Unit from '@/models/Unit';

export const dynamic = 'force-dynamic';

/* ---- Validation: identique au "create" ---- */
const zUrl = z.string().url();
const zBenefit = z.object({ icon: z.string().optional(), title: z.string().min(1), text: z.string().min(1) });
const zDay = z.object({
    title: z.string().min(1),
    videoUrl: zUrl,
    mantra: z.string().max(120).optional(),
    description: z.string().optional(),
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
function extractAssetId(url?: string) {
    if (!url) return '';
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') ?? '';
        if (u.hostname === 'youtu.be') return u.pathname.slice(1);
        if (u.hostname.includes('vimeo.com')) return u.pathname.split('/').filter(Boolean).pop() ?? '';
        return '';
    } catch {
        return '';
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    await requireAdmin();
    await dbConnect();

    const raw = await req.json();
    const body = zPayload.parse(raw);

    // ⬇️
    const { slug } = await params;
    const paramSlug = slugify(slug);
    const programSlug = slugify(body.slug);

    if (paramSlug !== programSlug) {
        return NextResponse.json({ error: 'slug_mismatch' }, { status: 400 });
    }

    const session = await mongoose.startSession();

    try {
        let unitsTotal = 0;

        await session.withTransaction(async () => {
            // 1) ProgramModel (catalogue)
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

            // 2) ProgramPage (marketing)
            const hero = body.marketing.hero;
            const durationBadge = body.marketing.durationLabel?.trim() || `${body.durationDays} jours • ${body.estMinutesPerDay} min/j`;
            const idealIfHighlight = body.marketing.idealIf?.trim() ? [{ icon: '✅', title: 'Idéal si…', text: body.marketing.idealIf.trim() }] : [];
            const heroImgObj = hero.heroImage && hero.heroImage.trim() ? { url: hero.heroImage.trim(), alt: '' } : null;

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

            // 3) Units (resync)
            await Unit.deleteMany({ programSlug }, { session });

            const created = await Unit.insertMany(
                body.days.map((d, i) => ({
                    programSlug,
                    unitType: 'day',
                    unitIndex: i + 1,
                    title: d.title,
                    durationMin: body.estMinutesPerDay ?? 25,
                    mantra: d.mantra ?? '',
                    videoAssetId: extractAssetId(d.videoUrl),
                    videoUrl: d.videoUrl,
                    audioAssetId: '',
                    contentParagraphs: d.description ? [d.description] : [],
                    safetyNote: '',
                    journalSchema: { sliders: [], questions: [], checks: [] },
                    status: 'draft',
                })),
                { session }
            );
            unitsTotal = created.length;
        });

        return NextResponse.json({ ok: true, programSlug, units: unitsTotal });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'update_failed';
        return NextResponse.json({ error: message }, { status: 400 });
    } finally {
        session.endSession();
    }
}

// ✅ corrige la signature : params est un Promise
export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    await requireAdmin();
    await dbConnect();

    // ✅ await params avant d'utiliser .slug
    const { slug } = await params;
    const programSlug = slugify(slug);

    const url = new URL(req.url);
    const dryRun = ['1', 'true', 'yes'].includes((url.searchParams.get('dryRun') || '').toLowerCase());

    const [pageCount, unitCount] = await Promise.all([ProgramPage.countDocuments({ programSlug }), Unit.countDocuments({ programSlug })]);
    const statesCount = 0; // branche ton vrai modèle ici si tu en as un

    if (dryRun) {
        return NextResponse.json({
            ok: true,
            deleted: { programPage: pageCount, units: unitCount, states: statesCount },
        });
    }

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            await ProgramPage.deleteOne({ programSlug }, { session });
            await Unit.deleteMany({ programSlug }, { session });
            await ProgramModel.deleteOne({ slug: programSlug }, { session });
            // await ProgramState.deleteMany({ programSlug }, { session }); // si tu as un modèle
        });

        return NextResponse.json({
            ok: true,
            deleted: { programPage: pageCount, units: unitCount, states: statesCount },
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'delete_failed';
        return NextResponse.json({ error: message }, { status: 400 });
    } finally {
        session.endSession();
    }
}
