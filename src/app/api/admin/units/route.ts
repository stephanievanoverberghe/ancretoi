// src/app/api/admin/units/[slug]/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import Unit from '@/models/Unit';
import { z } from 'zod';

const zSlider = z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    min: z.number().int().default(0),
    max: z.number().int().default(10),
    step: z.number().int().default(1),
});
const zQuestion = z.object({ key: z.string().min(1), label: z.string().min(1), placeholder: z.string().optional().default('') });
const zCheck = z.object({ key: z.string().min(1), label: z.string().min(1) });

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

const zPayload = z.object({ units: z.array(zUnit) });

export async function POST(req: Request, { params }: { params: { slug: string } }) {
    await requireAdmin();
    await dbConnect();

    const programSlug = params.slug.toLowerCase();
    const raw = await req.json().catch(() => ({}));
    const data = zPayload.parse(raw);

    // Upsert unitairement pour garder l’historique et l’index unique
    for (const u of data.units) {
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

    // Option: supprimer les jours au-delà de la liste envoyée (si tu veux “remplacement total”)
    const keepIdx = new Set(data.units.map((u) => u.unitIndex));
    await Unit.deleteMany({ programSlug, unitType: 'day', unitIndex: { $nin: Array.from(keepIdx) } });

    return NextResponse.json({ ok: true });
}
