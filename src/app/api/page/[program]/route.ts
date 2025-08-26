// app/api/page/[program]/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';

export async function GET(req: Request) {
    await dbConnect();

    const { pathname } = new URL(req.url);
    const parts = pathname.split('/').filter(Boolean);
    const programSeg = parts[parts.length - 1];

    if (!programSeg) {
        return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    const slug = decodeURIComponent(programSeg).toLowerCase();
    const page = await ProgramPage.findOne({ programSlug: slug, status: 'published' }).lean();

    if (!page) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({ page });
}
