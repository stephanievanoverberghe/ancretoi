// / /src/app/api/admin/blog/posts/route.ts

import 'server-only';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { createPost, listPosts } from '@/server/blog';
import { PATHS } from '@/lib/paths';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET() {
    await requireAdmin();
    const rows = await listPosts();
    return NextResponse.json({ ok: true, rows });
}

export async function POST(req: Request) {
    try {
        const me = await requireAdmin();
        const body = await req.json();
        const doc = await createPost({ ...body, authorEmail: me.email });

        // ✅ admin
        revalidatePath(PATHS.adminBlog);
        revalidatePath(PATHS.adminBlogPosts);
        // ✅ public
        revalidatePath(PATHS.publicBlogIndex);
        revalidatePath(PATHS.publicPost(doc.slug), 'page');

        return NextResponse.json({ ok: true, slug: doc.slug });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'server_error';
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
}
