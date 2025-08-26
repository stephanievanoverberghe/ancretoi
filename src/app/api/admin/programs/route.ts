// src/app/api/admin/programs/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import ProgramPage from '@/models/ProgramPage';
import { z } from 'zod';

const zPayload = z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    status: z.enum(['draft', 'published']).default('draft'),
});

export async function POST(req: Request) {
    await requireAdmin();
    await dbConnect();

    const ct = req.headers.get('content-type') ?? '';
    const raw = ct.includes('application/json') ? await req.json() : Object.fromEntries((await req.formData()).entries());

    const data = zPayload.parse(raw);
    const programSlug = data.slug.toLowerCase();

    const doc = await ProgramPage.findOneAndUpdate(
        { programSlug },
        {
            $setOnInsert: { programSlug },
            $set: {
                status: data.status,
                'hero.title': data.title,
            },
        },
        { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ ok: true, page: doc });
}
