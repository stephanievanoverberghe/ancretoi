// app/api/page/[program]/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import ProgramPage from '@/models/ProgramPage';

type RouteContext = { params: { program: string } };

export async function GET(_req: Request, { params }: RouteContext) {
    await dbConnect();

    const slug = params.program.toLowerCase();
    const page = await ProgramPage.findOne({ programSlug: slug, status: 'published' }).lean();

    if (!page) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json({ page });
}
