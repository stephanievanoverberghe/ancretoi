// src/app/api/admin/inspirations/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { Types } from 'mongoose';

import { dbConnect } from '@/db/connect';
import { requireAdmin } from '@/lib/authz';
import { InspirationModel } from '@/db/schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

type InspirationLean = {
    _id: Types.ObjectId;
    slug: string;
    title?: string | null;
    status: 'draft' | 'published';
    videoUrl?: string | null;
    deletedAt?: Date | null;
};

// --- utils ---
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
    // on vérifie uniquement parmi les actives
    // (l’index partiel protège de toute façon)
    while (await InspirationModel.exists({ slug: candidate, deletedAt: null })) {
        candidate = `${baseSlug}-${i++}`;
    }
    return candidate;
}

export async function GET(req: Request) {
    await requireAdmin();
    return NextResponse.redirect(new URL('/admin/inspirations/new', req.url), 302);
}

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

        const doc = await InspirationModel.findOne({ slug, deletedAt: null })
            .select({ _id: 1, slug: 1, title: 1, status: 1, videoUrl: 1, deletedAt: 1 })
            .lean<InspirationLean | null>();

        if (!doc) {
            return NextResponse.json({ ok: true, dryRun, deleted: { inspiration: 0 } });
        }

        if (dryRun) {
            return NextResponse.json({
                ok: true,
                dryRun: true,
                deleted: { inspiration: 1 },
                doc: {
                    _id: String(doc._id),
                    slug: doc.slug,
                    title: doc.title ?? '',
                    status: doc.status,
                    videoUrl: doc.videoUrl ?? null,
                },
            });
        }

        await InspirationModel.updateOne({ _id: doc._id }, { $set: { deletedAt: new Date() } });

        revalidatePath('/admin/inspirations');
        revalidatePath('/admin/inspirations/archives');
        revalidatePath('/inspirations');
        revalidatePath(`/inspirations/${doc.slug}`, 'page');

        return NextResponse.json({ ok: true, dryRun: false, deleted: { inspiration: 1 } });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'server_error';
        console.error('DELETE /api/admin/inspirations failed:', message);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}

// ✅ RESTORE
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

        const doc = await InspirationModel.findOne({ slug, deletedAt: { $ne: null } })
            .select({ _id: 1, slug: 1, title: 1 })
            .lean<Pick<InspirationLean, '_id' | 'slug' | 'title'> | null>();

        if (!doc) {
            return NextResponse.json({ ok: false, error: 'not_found_or_not_archived' }, { status: 404 });
        }

        // slug toujours dispo côté actives ?
        const exists = await InspirationModel.exists({ slug, deletedAt: null });
        const base = slugify(slug || doc.title || 'inspiration');
        const nextSlug = exists ? await findAvailableSlug(base) : slug;

        await InspirationModel.updateOne({ _id: doc._id }, { $set: { deletedAt: null, slug: nextSlug } });

        revalidatePath('/admin/inspirations');
        revalidatePath('/admin/inspirations/archives');
        revalidatePath('/inspirations');
        revalidatePath(`/inspirations/${nextSlug}`, 'page');

        return NextResponse.json({ ok: true, restored: true, slug: nextSlug });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'server_error';
        console.error('PATCH /api/admin/inspirations failed:', message);
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
}
