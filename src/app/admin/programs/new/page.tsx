import 'server-only';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const BUILD_LABEL = 'NewProgramPage v2 (server action)';

function slugify(input: string) {
    return input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default async function NewProgramPage() {
    await requireAdmin();
    await dbConnect();

    async function createProgram(formData: FormData) {
        'use server';
        await requireAdmin();
        await dbConnect();

        // helpers
        const getStr = (k: string) => String(formData.get(k) ?? '').trim();
        const getNumInt = (k: string, fallback: number) => {
            const raw = String(formData.get(k) ?? '').trim();
            const n = Number(raw);
            return Number.isFinite(n) ? Math.round(n) : fallback;
        };
        const getNumNullable = (k: string) => {
            const raw = String(formData.get(k) ?? '').trim();
            if (raw === '') return null;
            const n = Number(raw);
            return Number.isFinite(n) ? Math.round(n) : null;
        };
        const getBool = (k: string, def = true) => {
            const v = String(formData.get(k) ?? '')
                .trim()
                .toLowerCase();
            if (v === 'true' || v === '1' || v === 'on') return true;
            if (v === 'false' || v === '0' || v === 'off') return false;
            return def;
        };
        const cleanOpt = (s: string) => (s.length ? s : undefined);

        const raw = {
            slug: slugify(getStr('slug')),
            status: getStr('status') || 'draft',
            title: getStr('title'),

            durationDays: getNumInt('durationDays', 7),
            estMinutesPerDay: getNumInt('estMinutesPerDay', 20),
            level: getStr('level') || 'beginner',
            category: getStr('category') || 'wellbeing',
            tagsCsv: getStr('tags'),

            heroImageUrl: cleanOpt(getStr('heroImageUrl')),
            heroImageAlt: getStr('heroImageAlt'),
            cardImageUrl: cleanOpt(getStr('cardImageUrl')),
            cardImageAlt: getStr('cardImageAlt'),
            cardTagline: getStr('cardTagline'),
            cardSummary: getStr('cardSummary'),
            accentColor: getStr('accentColor'),

            // ✅ Prix ('' -> null)
            amountCents: getNumNullable('amountCents'),
            currency: (getStr('currency') || 'EUR').toUpperCase(),
            taxIncluded: getBool('taxIncluded', true),
            compareAtCents: getNumNullable('compareAtCents'),
            stripePriceId: cleanOpt(getStr('stripePriceId')),
        };

        const tags =
            raw.tagsCsv.length > 0
                ? raw.tagsCsv
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                : [];

        // Validation (rapide)
        const zUrlOrPath = z
            .string()
            .trim()
            .regex(/^(\/|https?:\/\/)/, 'Doit commencer par / ou http(s)://')
            .optional();
        const zNullableCents = z.union([z.number().int().min(0), z.null()]).optional();

        const Schema = z.object({
            slug: z.string().min(1, 'Slug requis'),
            status: z.enum(['draft', 'preflight', 'published']).default('draft'),
            title: z.string().min(1, 'Titre requis'),
            durationDays: z.number().int().min(1).max(365),
            estMinutesPerDay: z.number().int().min(1).max(180),
            level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
            category: z.string().min(1),
            tags: z.array(z.string()).default([]),

            heroImageUrl: zUrlOrPath,
            heroImageAlt: z.string().optional(),
            cardImageUrl: zUrlOrPath,
            cardImageAlt: z.string().optional(),
            cardTagline: z.string().optional(),
            cardSummary: z.string().optional(),
            accentColor: z.string().optional(),

            amountCents: zNullableCents,
            currency: z.string().length(3).optional().default('EUR'),
            taxIncluded: z.boolean().optional().default(true),
            compareAtCents: zNullableCents,
            stripePriceId: z.string().optional(),
        });

        const data = Schema.parse({ ...raw, tags });
        const programSlug = data.slug;

        await ProgramPage.findOneAndUpdate(
            { programSlug },
            {
                $setOnInsert: { programSlug },
                $set: {
                    status: data.status,
                    'hero.title': data.title,
                    ...(data.heroImageUrl ? { 'hero.heroImage': { url: data.heroImageUrl, alt: data.heroImageAlt ?? '' } } : {}),
                    card: {
                        image: data.cardImageUrl ? { url: data.cardImageUrl, alt: data.cardImageAlt ?? '' } : undefined,
                        tagline: data.cardTagline || undefined,
                        summary: data.cardSummary || undefined,
                        accentColor: data.accentColor || undefined,
                        badges: [`${data.durationDays} jours`, data.level === 'beginner' ? 'Débutant' : data.level === 'intermediate' ? 'Intermédiaire' : 'Avancé'].filter(Boolean),
                    },
                    meta: {
                        durationDays: data.durationDays,
                        estMinutesPerDay: data.estMinutesPerDay,
                        level: data.level,
                        category: data.category,
                        tags: data.tags ?? [],
                        language: 'fr',
                    },
                    // ✅ prix
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

        redirect(`/admin/programs/${programSlug}/page?created=1`);
    }

    return (
        <div className="max-w-2xl p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Nouveau programme</h1>
            <div className="text-xs text-muted-foreground">{BUILD_LABEL}</div>

            <form action={createProgram} className="grid gap-3">
                {/* ... (ton UI inchangé) ... */}
                {/* Je laisse volontairement tout ton UI en place */}
            </form>
        </div>
    );
}
