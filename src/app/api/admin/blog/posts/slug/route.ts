import 'server-only';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { suggestSlug } from '@/server/blog';

export async function GET(req: Request) {
    await requireAdmin();
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    if (!q) return NextResponse.json({ ok: false, error: 'missing_q' }, { status: 400 });
    const s = await suggestSlug(q);
    return NextResponse.json({ ok: true, slug: s });
}
