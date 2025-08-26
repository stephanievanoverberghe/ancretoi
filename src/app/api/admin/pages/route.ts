// src/app/api/admin/pages/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import ProgramPage from '@/models/ProgramPage';
import { z } from 'zod';

const zCurr = z.object({ label: z.string().min(1), summary: z.string().optional() });
const zBenefit = z.object({ icon: z.string().optional(), title: z.string().min(1), text: z.string().min(1) });
const zTesti = z.object({ name: z.string().min(1), role: z.string().optional(), text: z.string().min(1), avatar: z.string().optional() });
const zQA = z.object({ q: z.string().min(1), a: z.string().min(1) });

const zPayload = z.object({
    programSlug: z.string().min(1),
    status: z.enum(['draft', 'preflight', 'published']).default('draft'),
    hero: z.object({
        eyebrow: z.string().optional(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        ctaLabel: z.string().optional(),
        ctaHref: z.string().optional(),
        heroImage: z.string().url().optional(), // URL simple depuis l’UI (alt facultatif via autre champ si besoin)
    }),
    card: z
        .object({
            image: z.string().url().optional(),
            tagline: z.string().optional(),
            summary: z.string().optional(),
            accentColor: z.string().optional(),
        })
        .optional()
        .default({}),
    meta: z
        .object({
            durationDays: z.coerce.number().int().min(1).max(365).optional(),
            estMinutesPerDay: z.coerce.number().int().min(1).max(180).optional(),
            level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
            category: z.string().optional(),
            tags: z.array(z.string()).optional(),
        })
        .optional()
        .default({}),
    highlights: z.array(zBenefit).default([]),
    curriculum: z.array(zCurr).default([]),
    testimonials: z.array(zTesti).default([]),
    faq: z.array(zQA).default([]),
    seo: z.object({ title: z.string().optional(), description: z.string().optional(), image: z.string().optional() }).optional().default({}),
    intro: z
        .object({
            finalite: z.string().optional(),
            pourQui: z.string().optional(),
            pasPourQui: z.string().optional(),
            commentUtiliser: z.string().optional(),
            cadreSecurite: z.string().optional(),
        })
        .optional()
        .default({}),
    conclusion: z
        .object({
            texte: z.string().optional(),
            kitEntretien: z.string().optional(),
            cap7_14_30: z.string().optional(),
            siCaDeraille: z.string().optional(),
            allerPlusLoin: z.string().optional(),
        })
        .optional()
        .default({}),
});

export async function POST(req: Request) {
    await requireAdmin();
    await dbConnect();

    const data = zPayload.parse(await req.json());
    const programSlug = data.programSlug.toLowerCase();

    const update: Record<string, unknown> = {
        status: data.status,
        hero: {
            ...data.hero,
            heroImage: data.hero.heroImage ? { url: data.hero.heroImage, alt: data.hero.title ?? '' } : undefined,
        },
        card: {
            image: data.card.image ? { url: data.card.image, alt: data.hero.title ?? '' } : undefined,
            tagline: data.card.tagline,
            summary: data.card.summary,
            accentColor: data.card.accentColor,
            badges: [
                data.meta.durationDays ? `${data.meta.durationDays} jours` : undefined,
                data.meta.level === 'beginner' ? 'Débutant' : data.meta.level === 'intermediate' ? 'Intermédiaire' : data.meta.level === 'advanced' ? 'Avancé' : undefined,
            ].filter(Boolean),
        },
        meta: { ...data.meta },
        highlights: data.highlights,
        curriculum: data.curriculum,
        testimonials: data.testimonials,
        faq: data.faq,
        seo: data.seo,
        intro: data.intro,
        conclusion: data.conclusion,
    };

    const page = await ProgramPage.findOneAndUpdate({ programSlug }, { $setOnInsert: { programSlug }, $set: update }, { upsert: true, new: true }).lean();

    return NextResponse.json({ ok: true, page });
}
