// src/app/api/admin/pages/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import ProgramPage from '@/models/ProgramPage';
import { z } from 'zod';

const zUrlOrPath = z
    .string()
    .trim()
    .regex(/^(\/|https?:\/\/)/, 'Doit commencer par / ou http(s)://');

const zImageInput = z.union([
    zUrlOrPath, // "/images/..." ou "https://..."
    z.object({
        url: zUrlOrPath,
        alt: z.string().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
    }),
]);

const zBenefit = z.object({
    icon: z.string().optional(),
    title: z.string().min(1),
    text: z.string().min(1),
});
const zCurriculum = z.object({ label: z.string().min(1), summary: z.string().optional() });
const zTestimonial = z.object({
    name: z.string().min(1),
    role: z.string().optional(),
    text: z.string().min(1),
    avatar: z.string().optional(),
});
const zQA = z.object({ q: z.string().min(1), a: z.string().min(1) });

// ✅ Préprocess pour accepter CSV ou array pour tags
const zMeta = z
    .object({
        durationDays: z.coerce.number().int().min(1).max(365).optional(),
        estMinutesPerDay: z.coerce.number().int().min(1).max(180).optional(),
        level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        category: z.string().optional(),
        tags: z
            .preprocess((v) => {
                if (typeof v === 'string') {
                    return v
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                }
                return v;
            }, z.array(z.string()).optional())
            .optional(),
        language: z.string().optional(),
    })
    .partial()
    .optional();

const zPayload = z.object({
    programSlug: z.string().min(1),

    status: z.enum(['draft', 'preflight', 'published']).optional(),

    hero: z
        .object({
            eyebrow: z.string().optional(),
            title: z.string().optional(),
            subtitle: z.string().optional(),
            ctaLabel: z.string().optional(),
            ctaHref: z.string().optional(),
            heroImage: zImageInput.optional(),
        })
        .partial()
        .optional(),

    card: z
        .object({
            image: zImageInput.optional(),
            tagline: z.string().optional(),
            summary: z.string().optional(),
            accentColor: z.string().optional(),
        })
        .partial()
        .optional(),

    // ✅ Page de garde
    pageGarde: z
        .object({
            heading: z.string().optional(),
            tagline: z.string().optional(),
            format: z.string().optional(),
            audience: z.string().optional(),
            safetyNote: z.string().optional(),
        })
        .partial()
        .optional(),

    meta: zMeta,

    highlights: z.array(zBenefit).optional(),
    curriculum: z.array(zCurriculum).optional(),
    testimonials: z.array(zTestimonial).optional(),
    faq: z.array(zQA).optional(),

    seo: z
        .object({
            title: z.string().optional(),
            description: z.string().optional(),
            image: zUrlOrPath.optional(),
        })
        .partial()
        .optional(),

    intro: z
        .object({
            finalite: z.string().optional(),
            pourQui: z.string().optional(),
            pasPourQui: z.string().optional(),
            commentUtiliser: z.string().optional(),
            cadreSecurite: z.string().optional(),
        })
        .partial()
        .optional(),

    conclusion: z
        .object({
            texte: z.string().optional(),
            kitEntretien: z.string().optional(),
            cap7_14_30: z.string().optional(),
            siCaDeraille: z.string().optional(),
            allerPlusLoin: z.string().optional(),
        })
        .partial()
        .optional(),
});

function coerceImage(img?: unknown) {
    if (typeof img === 'string') return { url: img, alt: '' };
    if (img && typeof img === 'object' && 'url' in img) {
        const o = img as { url: string; alt?: string; width?: number; height?: number };
        return { url: o.url, alt: o.alt ?? '', width: o.width, height: o.height };
        // pas d'`any` ici
    }
    return undefined;
}

export async function POST(req: Request) {
    try {
        await requireAdmin();
        await dbConnect();

        // ✅ pas d'`any` : on reste en `unknown`
        const raw: unknown = await req.json().catch(() => ({}));

        // Zod gère maintenant la conversion des tags CSV → array
        const data = zPayload.parse(raw);
        const { programSlug } = data;

        const set: Record<string, unknown> = {};

        if (data.status) set.status = data.status;

        if (data.hero) {
            const { heroImage, ...rest } = data.hero;
            set.hero = { ...rest, ...(heroImage ? { heroImage: coerceImage(heroImage) } : {}) };
        }

        if (data.card) {
            const { image, ...rest } = data.card;
            set.card = { ...rest, ...(image ? { image: coerceImage(image) } : {}) };
        }

        if (data.pageGarde) {
            set.pageGarde = data.pageGarde; // ✅ écrit bien la page de garde
        }

        if (data.meta) set.meta = data.meta;
        if (data.highlights) set.highlights = data.highlights;
        if (data.curriculum) set.curriculum = data.curriculum;
        if (data.testimonials) set.testimonials = data.testimonials;
        if (data.faq) set.faq = data.faq;
        if (data.seo) set.seo = data.seo;
        if (data.intro) set.intro = data.intro;
        if (data.conclusion) set.conclusion = data.conclusion;

        const doc = await ProgramPage.findOneAndUpdate({ programSlug }, { $setOnInsert: { programSlug }, $set: set }, { new: true, upsert: true }).lean();

        return NextResponse.json({ ok: true, page: doc });
    } catch (err) {
        console.error('POST /api/admin/pages error:', err);
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
}
