// src/app/api/admin/programs/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import ProgramPage from '@/models/ProgramPage';
import { z } from 'zod';

// Accepte "/.../image.jpg" OU "https://..."
const zUrlOrPath = z
    .string()
    .trim()
    .min(1)
    .regex(/^(\/|https?:\/\/)/, 'Doit commencer par / (chemin public) ou http(s)://');

const zPayload = z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    status: z.enum(['draft', 'preflight', 'published']).default('draft'),
    durationDays: z.coerce.number().int().min(1).max(365).default(7),
    estMinutesPerDay: z.coerce.number().int().min(1).max(180).default(20),
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    category: z.string().default('wellbeing'),
    tags: z.array(z.string()).optional().default([]),
    heroImageUrl: zUrlOrPath.optional(),
    heroImageAlt: z.string().optional(),
    cardImageUrl: zUrlOrPath.optional(),
    cardImageAlt: z.string().optional(),
    cardTagline: z.string().optional(),
    cardSummary: z.string().optional(),
    accentColor: z.string().optional(),
});

function slugify(input: string) {
    return input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Type guard util
function isObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// Récupère une prop d’un objet inconnu
function getProp(obj: unknown, key: string): unknown {
    return isObject(obj) ? obj[key] : undefined;
}

// Convertit tags (string CSV, string[], FormData string) -> string[]
function coerceTags(value: unknown): string[] | undefined {
    if (Array.isArray(value)) return value.map((s) => String(s));
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }
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

    // Lecture brute (JSON ou FormData) sans any
    let raw: unknown;
    if (ct.includes('application/json')) {
        raw = await req.json(); // unknown
    } else {
        const fd = await req.formData();
        // On force en { [k: string]: string } pour zod
        const obj: Record<string, string> = {};
        for (const [k, v] of fd.entries()) obj[k] = typeof v === 'string' ? v : String(v);
        raw = obj;
    }

    // Base object safe
    const base: Record<string, unknown> = isObject(raw) ? raw : {};
    // Tags normalisés
    const tags = coerceTags(getProp(raw, 'tags'));

    for (const k of ['heroImageUrl', 'cardImageUrl', 'heroImageAlt', 'cardImageAlt', 'cardTagline', 'cardSummary', 'accentColor']) {
        const v = base[k];
        if (typeof v === 'string' && v.trim() === '') {
            delete base[k]; // les champs vides ne passent pas au schéma
        }
    }

    const data = zPayload.parse({
        ...base,
        ...(tags ? { tags } : {}),
    });

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
            },
        },
        { new: true, upsert: true }
    ).lean();

    if (accept.includes('text/html')) {
        return NextResponse.redirect(new URL(`/admin/programs/${programSlug}/page`, req.url), 303);
    }
    return NextResponse.json({ ok: true, page: doc });
}
