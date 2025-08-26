// app/api/page/[program]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';

export async function GET(_: NextRequest, { params }: { params: { program: string } }) {
    await dbConnect();
    const page = await ProgramPage.findOne({ programSlug: params.program.toLowerCase(), status: 'published' }).lean();
    if (!page) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ page });
}
