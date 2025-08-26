// src/app/api/admin/units/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import Unit from '@/models/Unit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/* ----------------------- Zod schemas ----------------------- */
const zSlider = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    min: z.number().int().default(0),
    max: z.number().int().default(10),
    step: z.number().int().default(1),
});
const zQuestion = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    placeholder: z.string().optional().default(''),
});
const zCheck = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
});

const zUnit = z.object({
    unitIndex: z.number().int().min(1),
    title: z.string().min(1),
    durationMin: z.number().int().min(1).max(180).default(25),
    mantra: z.string().optional().default(''),
    videoAssetId: z.string().optional().default(''),
    audioAssetId: z.string().optional().default(''),
    contentParagraphs: z.array(z.string()).default([]),
    safetyNote: z.string().optional().default(''),
    journal: z
        .object({
            sliders: z.array(zSlider).default([]),
            questions: z.array(zQuestion).default([]),
            checks: z.array(zCheck).default([]),
        })
        .default({ sliders: [], questions: [], checks: [] }),
    status: z.enum(['draft', 'published']).default('draft'),
});

const zPayload = z.object({
    programSlug: z.string().min(1).optional(), // facultatif si passé en query ?slug=
    units: z.array(zUnit),
});

/* ----------------------- Utils ----------------------- */
function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/* ----------------------- GET: liste des unités ----------------------- */
export async function GET(req: Request) {
    await requireAdmin();
    await dbConnect();

    const url = new URL(req.url);
    const slug = (url.searchParams.get('slug') || '').toLowerCase();

    if (!slug) {
        return NextResponse.json({ error: 'missing_slug' }, { status: 400 });
    }

    const units = await Unit.find({ programSlug: slug, unitType: 'day' }).sort({ unitIndex: 1 }).lean();

    return NextResponse.json({ ok: true, units });
}

/* ----------------------- POST: upsert des unités ----------------------- */
export async function POST(req: Request) {
    await requireAdmin();
    await dbConnect();

    const url = new URL(req.url);
    const slugFromQuery = (url.searchParams.get('slug') || '').toLowerCase();

    // Accepte JSON et FormData
    const ct = req.headers.get('content-type') ?? '';
    let raw: unknown;
    if (ct.includes('application/json')) {
        raw = await req.json().catch(() => ({}));
    } else {
        const fd = await req.formData();
        const obj: Record<string, unknown> = {};
        for (const [k, v] of fd.entries()) obj[k] = typeof v === 'string' ? v : String(v);
        raw = obj;
    }

    const base = isRecord(raw) ? raw : {};
    const parsed = zPayload.parse(base);

    const programSlug = (parsed.programSlug || slugFromQuery).toLowerCase();
    if (!programSlug) {
        return NextResponse.json({ error: 'missing_programSlug' }, { status: 400 });
    }

    // Upsert unitaire pour chaque jour
    for (const u of parsed.units) {
        await Unit.findOneAndUpdate(
            { programSlug, unitIndex: u.unitIndex, unitType: 'day' },
            {
                $set: {
                    title: u.title,
                    durationMin: u.durationMin,
                    mantra: u.mantra,
                    videoAssetId: u.videoAssetId,
                    audioAssetId: u.audioAssetId,
                    contentParagraphs: u.contentParagraphs,
                    safetyNote: u.safetyNote,
                    journalSchema: u.journal,
                    status: u.status,
                },
                $setOnInsert: { programSlug, unitType: 'day' },
            },
            { upsert: true, new: true }
        ).lean();
    }

    // Optionnel : supprime les jours non envoyés
    const keepIdx = new Set(parsed.units.map((u) => u.unitIndex));
    await Unit.deleteMany({
        programSlug,
        unitType: 'day',
        unitIndex: { $nin: Array.from(keepIdx) },
    });

    return NextResponse.json({ ok: true });
}
