// src/app/api/admin/blog/categories/delete/route.ts
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { CategoryModel, PostModel } from '@/db/schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function previewOrDelete(req: NextRequest, { dryRunOnly = false }: { dryRunOnly?: boolean }) {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get('slug') || '').trim().toLowerCase();
    const dryRun = searchParams.get('dryRun') === 'true';
    const force = searchParams.get('force') === 'true';

    if (!slug) {
        return NextResponse.json({ ok: false, error: 'Paramètre "slug" requis.' }, { status: 400 });
    }

    const cat = await CategoryModel.findOne({ slug }).select({ _id: 1, name: 1, slug: 1, description: 1, color: 1, icon: 1, imagePath: 1, imageAlt: 1 }).lean();

    if (!cat) {
        return NextResponse.json({ ok: false, error: 'Catégorie introuvable.' }, { status: 404 });
    }

    const postsUsing = await PostModel.countDocuments({
        deletedAt: null,
        categoryId: cat._id,
    });

    // --- Dry run (ou GET preview) ---
    if (dryRun || dryRunOnly) {
        return NextResponse.json({
            ok: true,
            doc: {
                _id: String(cat._id),
                slug: cat.slug,
                name: cat.name,
                description: cat.description ?? '',
                color: cat.color ?? null,
                icon: cat.icon ?? null,
                imagePath: cat.imagePath ?? null,
                imageAlt: cat.imageAlt ?? null,
                postsUsing,
            },
        });
    }

    // --- Sécurité : refuser si des posts l’utilisent (sauf force=true) ---
    if (postsUsing > 0 && !force) {
        return NextResponse.json(
            {
                ok: false,
                error: 'Cette catégorie est encore utilisée par des articles. Ajoute `?force=true` pour la supprimer et détacher les articles (categoryId → null).',
                postsUsing,
            },
            { status: 409 }
        );
    }

    // --- Si force, on détache d’abord les posts (unset categoryId) ---
    if (postsUsing > 0 && force) {
        await PostModel.updateMany({ deletedAt: null, categoryId: cat._id }, { $set: { categoryId: null } });
    }

    // --- Suppression réelle ---
    await CategoryModel.findByIdAndDelete(cat._id);

    // --- Revalidate zones Admin/Blog ---
    revalidatePath('/admin/blog/categories');
    revalidatePath('/admin/blog/posts'); // si tu listes par catégorie quelque part
    revalidatePath('/admin/blog'); // header/compteurs, etc.

    return NextResponse.json({ ok: true, detachedPosts: force ? postsUsing : 0 });
}

// Dry-run via GET (aperçu)
export async function GET(req: NextRequest) {
    return previewOrDelete(req, { dryRunOnly: true });
}

// Suppression réelle
export async function DELETE(req: NextRequest) {
    return previewOrDelete(req, { dryRunOnly: false });
}
