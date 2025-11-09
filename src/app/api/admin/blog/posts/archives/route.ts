// src/app/api/admin/blog/posts/archives/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { restorePost } from '@/server/blog';
import { PATHS } from '@/lib/paths';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// PATCH /api/admin/blog/posts/archives  with body { action: 'restore', slug?: string, id?: string }
export async function PATCH(req: Request) {
    try {
        await requireAdmin();

        let action = '';
        let id = '';
        let slug = '';

        try {
            const b = await req.json();
            action = (b?.action || '').trim();
            id = (b?.id || '').trim();
            slug = (b?.slug || '').trim();
        } catch {
            const url = new URL(req.url);
            action = (url.searchParams.get('action') || '').trim();
            id = (url.searchParams.get('id') || '').trim();
            slug = (url.searchParams.get('slug') || '').trim();
        }

        if (action !== 'restore' || (!id && !slug)) {
            return NextResponse.json({ ok: false, error: 'missing_or_invalid_params' }, { status: 400 });
        }

        const needle = id || slug; // priorité à l’id
        const out = await restorePost(needle);

        // Revalidate admin & public
        revalidatePath(PATHS.adminBlog);
        revalidatePath(PATHS.adminBlogPosts);
        revalidatePath(PATHS.adminBlogPostsArchives);
        revalidatePath(PATHS.publicBlogIndex);
        revalidatePath(PATHS.publicPost(out.slug), 'page');

        return NextResponse.json({ ok: true, ...out });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'server_error';
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
}
