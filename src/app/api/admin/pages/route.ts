// app/api/admin/pages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';

export async function POST(req: NextRequest) {
    await dbConnect();
    const body = await req.json();
    const { programSlug, ...rest } = body;
    if (!programSlug) return NextResponse.json({ error: 'missing_programSlug' }, { status: 400 });

    await ProgramPage.updateOne({ programSlug }, { $set: { ...rest } }, { upsert: true });
    return NextResponse.json({ ok: true });
}
