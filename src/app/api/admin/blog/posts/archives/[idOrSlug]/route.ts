// src/app/api/admin/blog/posts/archives/[idOrSlug]/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { getArchivedPost, hardDeletePost } from '@/server/blog';
import { PATHS } from '@/lib/paths';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// ⚠️ Next 15: params est un Promise
type Ctx = { params: Promise<{ idOrSlug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    await requireAdmin();
    const { idOrSlug } = await ctx.params;
    const doc = await getArchivedPost(idOrSlug);
    if (!doc) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    return NextResponse.json({ ok: true, doc });
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        await requireAdmin();
        const { idOrSlug } = await ctx.params;
        const res = await hardDeletePost(idOrSlug);

        // revalidate admin & public
        revalidatePath(PATHS.adminBlog);
        revalidatePath(PATHS.adminBlogPosts);
        revalidatePath(PATHS.adminBlogPostsArchives);
        revalidatePath(PATHS.publicBlogIndex);

        return NextResponse.json({ ok: true, ...res });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'server_error';
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
}
