import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import Unit from '@/models/Unit';
import { requireAdmin } from '@/lib/authz';
import { z } from 'zod';

// mêmes types que ton UnitsEditor
const zField = z.discriminatedUnion('type', [
    z.object({
        type: z.enum(['text_short', 'text_long']),
        id: z.string().min(1),
        label: z.string().min(1),
        required: z.boolean().optional(),
        minLen: z.number().int().min(0).optional(),
        maxLen: z.number().int().min(1).optional(),
        placeholder: z.string().optional(),
    }),
    z.object({
        type: z.literal('slider'),
        id: z.string().min(1),
        label: z.string().min(1),
        required: z.boolean().optional(),
        min: z.number().int().min(0).optional(),
        max: z.number().int().min(1).optional(),
        step: z.number().int().min(1).optional(),
    }),
    z.object({ type: z.literal('checkbox'), id: z.string().min(1), label: z.string().min(1), required: z.boolean().optional() }),
    z.object({ type: z.literal('chips'), id: z.string().min(1), label: z.string().min(1), required: z.boolean().optional(), options: z.array(z.string()).optional() }),
    // bonus: groupe de scores (J1 & J7)
    z.object({ type: z.literal('score_group'), id: z.string().min(1), label: z.string().min(1) }),
]);

const zUnitForm = z.object({
    programSlug: z.string().min(1),
    unitIndex: z.number().int().min(1).max(7),
    title: z.string().min(1),
    introText: z.string().optional(),
    mantra: z.string().optional(),
    durationMin: z.number().int().min(1).optional(),
    videoAssetId: z.string().optional(),
    status: z.enum(['draft', 'published']).optional(),
    fields: z.array(zField).max(24),
});

function validateUniqueIds(fields: z.infer<typeof zField>[]) {
    const ids = fields.map((f) => f.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) throw new Error(`IDs de champs dupliqués: "${dup}"`);
}

export async function POST(req: Request) {
    await requireAdmin();
    await dbConnect();
    const payload = await req.json();
    const data = zUnitForm.parse(payload);

    validateUniqueIds(data.fields);

    const unit = await Unit.findOneAndUpdate(
        { programSlug: data.programSlug.toLowerCase(), unitType: 'day', unitIndex: data.unitIndex },
        {
            $set: {
                programSlug: data.programSlug.toLowerCase(),
                unitType: 'day',
                unitIndex: data.unitIndex,
                title: data.title,
                introText: data.introText ?? '',
                mantra: data.mantra ?? '',
                durationMin: data.durationMin ?? 20,
                videoAssetId: data.videoAssetId,
                journalSchema: { fields: data.fields },
                status: data.status ?? 'draft',
            },
        },
        { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ ok: true, unit });
}
