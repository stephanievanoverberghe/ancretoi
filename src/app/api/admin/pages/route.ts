// src/app/api/admin/pages/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import ProgramPage from '@/models/ProgramPage';
import { z } from 'zod';

const zUrlOrPath = z
    .string()
    .trim()
    .regex(/^(\/|https?:\/\/)/, 'Commence par / ou http(s)://')
    .optional();

const zPayload = z
    .object({
        programSlug: z.string().min(1),
        status: z.enum(['draft', 'preflight', 'published']).default('draft'),
        hero: z
            .object({
                eyebrow: z.string().optional(),
                title: z.string().optional(),
                subtitle: z.string().optional(),
                ctaLabel: z.string().optional(),
                ctaHref: z.string().optional(),
                heroImage: zUrlOrPath,
            })
            .partial(),
        pageGarde: z
            .object({
                heading: z.string().optional(), // RESET-7
                tagline: z.string().optional(), // 7 jours pour…
                audience: z.string().optional(), // Créé pour…
                format: z.string().optional(), // Format…
                safetyNote: z.string().optional(), // Note sécurité…
            })
            .partial(),
        intro: z
            .object({
                finalite: z.string().optional(),
                pourQui: z.string().optional(),
                pasPourQui: z.string().optional(),
                commentUtiliser: z.string().optional(),
                cadreSecurite: z.string().optional(),
            })
            .partial(),
        conclusion: z
            .object({
                texte: z.string().optional(),
                kitEntretien: z.string().optional(),
                cap7_14_30: z.string().optional(),
                siCaDeraille: z.string().optional(),
                allerPlusLoin: z.string().optional(),
            })
            .partial(),
    })
    .strict();

export async function POST(req: Request) {
    await requireAdmin();
    await dbConnect();

    const raw = await req.json().catch(() => ({}));
    const data = zPayload.parse(raw);

    // 🔧 fusion des champs potentiellement dupliqués
    const introPourQui = data.intro?.pourQui ?? data.pageGarde?.audience;
    const introCadre = data.intro?.cadreSecurite ?? data.pageGarde?.safetyNote;

    const doc = await ProgramPage.findOneAndUpdate(
        { programSlug: data.programSlug.toLowerCase() },
        {
            $set: {
                status: data.status,

                // HERO
                'hero.eyebrow': data.hero?.eyebrow,
                'hero.title': data.hero?.title,
                'hero.subtitle': data.hero?.subtitle,
                'hero.ctaLabel': data.hero?.ctaLabel,
                'hero.ctaHref': data.hero?.ctaHref,
                'hero.heroImage.url': data.hero?.heroImage,

                // Page de garde (ne pas réécrire intro.* ici)
                'seo.title': data.pageGarde?.heading ?? undefined,
                'card.tagline': data.pageGarde?.tagline,
                'card.summary': data.pageGarde?.format,

                // INTRO (une seule fois, avec valeurs fusionnées)
                'intro.finalite': data.intro?.finalite,
                'intro.pourQui': introPourQui,
                'intro.pasPourQui': data.intro?.pasPourQui,
                'intro.commentUtiliser': data.intro?.commentUtiliser,
                'intro.cadreSecurite': introCadre,

                // CONCLUSION
                'conclusion.texte': data.conclusion?.texte,
                'conclusion.kitEntretien': data.conclusion?.kitEntretien,
                'conclusion.cap7_14_30': data.conclusion?.cap7_14_30,
                'conclusion.siCaDeraille': data.conclusion?.siCaDeraille,
                'conclusion.allerPlusLoin': data.conclusion?.allerPlusLoin,
            },
            $setOnInsert: { programSlug: data.programSlug.toLowerCase() },
        },
        { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ ok: true, page: doc });
}
