import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { ProgramModel } from '@/db/schemas';
import { z } from 'zod';

const zProgram = z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    status: z.enum(['draft', 'published']).default('draft'),
});

export async function POST(req: Request) {
    await requireAdmin();
    await dbConnect();

    const ct = req.headers.get('content-type') ?? '';
    let raw: unknown;

    if (ct.includes('application/json')) {
        raw = await req.json();
    } else {
        const fd = await req.formData();
        raw = Object.fromEntries(fd.entries()); // ⬅️ sans any
    }

    const data = zProgram.parse(raw);

    const doc = await ProgramModel.findOneAndUpdate(
        { slug: data.slug.toLowerCase() },
        { $setOnInsert: { slug: data.slug.toLowerCase() }, $set: { title: data.title, status: data.status } },
        { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ ok: true, program: doc });
}
