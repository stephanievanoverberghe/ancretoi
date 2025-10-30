// src/app/api/admin/blog/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { Types } from 'mongoose';

import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { PostModel } from '@/db/schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

type PostLean = {
    _id: Types.ObjectId;
    slug: string;
    title?: string | null;
    status: 'draft' | 'published';
    coverPath?: string | null;
    deletedAt?: Date | null;
};

function slugify(input: string) {
    return input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

async function findAvailableSlug(baseSlug: string) {
    let candidate = baseSlug;
    let i = 2;
    // On vérifie collision sur les actifs uniquement (deletedAt: null)
    while (await PostModel.exists({ slug: candidate, deletedAt: null })) {
        candidate = `${baseSlug}-${i++}`;
    }
    return candidate;
}

export async function GET(req: Request) {
    await requireAdmin();
    return NextResponse.redirect(new URL('/admin/blog/new', req.url), 302);
}

// DELETE => soft delete (avec dryRun)
export async function DELETE(req: Request) {
    try {
        await requireAdmin();
        await dbConnect();

        const url = new URL(req.url);
        const slug = (url.searchParams.get('slug') || '').trim().toLowerCase();
        const dryRun = url.searchParams.get('dryRun') === 'true';

        if (!slug) {
            return NextResponse.json({ ok: false, error: 'missing_slug' }, { status: 400 });
        }

        const doc = await PostModel.findOne({ slug, deletedAt: null }).select({ _id: 1, slug: 1, title: 1, status: 1, coverPath: 1 }).lean<PostLean | null>();

        if (!doc) {
            return NextResponse.json({ ok: true, dryRun, deleted: { post: 0 } });
        }

        if (dryRun) {
            return NextResponse.json({
                ok: true,
                dryRun: true,
                deleted: { post: 1 },
                doc: {
                    _id: String(doc._id),
                    slug: doc.slug,
                    title: doc.title ?? '',
                    status: doc.status,
                    coverPath: doc.coverPath ?? null,
                },
            });
        }

        await PostModel.updateOne({ _id: doc._id }, { $set: { deletedAt: new Date() } });

        revalidatePath('/admin/blog');
        revalidatePath('/admin/blog/archives');
        revalidatePath('/blog');
        revalidatePath(`/blog/${doc.slug}`, 'page');

        return NextResponse.json({ ok: true, dryRun: false, deleted: { post: 1 } });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'server_error';
        console.error('DELETE /api/admin/blog failed:', message);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

// PATCH => restore
export async function PATCH(req: Request) {
    try {
        await requireAdmin();
        await dbConnect();

        const url = new URL(req.url);
        const slug = (url.searchParams.get('slug') || '').trim().toLowerCase();
        const action = (url.searchParams.get('action') || '').trim();

        if (!slug || action !== 'restore') {
            return NextResponse.json({ ok: false, error: 'missing_or_invalid_params' }, { status: 400 });
        }

        const doc = await PostModel.findOne({ slug, deletedAt: { $ne: null } })
            .select({ _id: 1, slug: 1, title: 1 })
            .lean<Pick<PostLean, '_id' | 'slug' | 'title'> | null>();

        if (!doc) {
            return NextResponse.json({ ok: false, error: 'not_found_or_not_archived' }, { status: 404 });
        }

        const exists = await PostModel.exists({ slug, deletedAt: null });
        const base = slugify(slug || doc.title || 'article');
        const nextSlug = exists ? await findAvailableSlug(base) : slug;

        await PostModel.updateOne({ _id: doc._id }, { $set: { deletedAt: null, slug: nextSlug } });

        revalidatePath('/admin/blog');
        revalidatePath('/admin/blog/archives');
        revalidatePath('/blog');
        revalidatePath(`/blog/${nextSlug}`, 'page');

        return NextResponse.json({ ok: true, restored: true, slug: nextSlug });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'server_error';
        console.error('PATCH /api/admin/blog failed:', message);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
