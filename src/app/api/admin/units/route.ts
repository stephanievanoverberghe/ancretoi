// app/api/admin/units/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import Unit from '@/models/Unit';

export async function POST(req: NextRequest) {
    await dbConnect();
    const body = await req.json();
    const { programSlug, unitIndex, ...rest } = body;
    if (!programSlug || !unitIndex) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

    await Unit.updateOne({ programSlug, unitType: 'day', unitIndex }, { $set: { ...rest } }, { upsert: true });

    return NextResponse.json({ ok: true });
}
