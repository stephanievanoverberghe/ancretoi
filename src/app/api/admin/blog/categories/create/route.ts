// src/app/api/admin/blog/categories/create/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import { CategoryModel } from '@/db/schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

type Body = {
    name: string;
    slug?: string;
    description?: string;
    color?: string | null;
    icon?: string | null;
    imagePath?: string | null;
    imageAlt?: string | null;
};

function slugify(input: string): string {
    return (input || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function sanitizeLocalPath(p?: string | null): string | null {
    const s = (p ?? '').trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) {
        throw new Error("L'image doit être un chemin local sous /public (ex: /images/blog/categories/cover.jpg).");
    }
    const normalized = s.startsWith('/') ? s : `/${s}`;
    if (normalized.includes('..')) throw new Error('Chemin image invalide.');
    return normalized;
}

function normalizeHexColor(c?: string | null): string | null {
    const v = (c ?? '').trim();
    if (!v) return null;
    const m3 = /^#([0-9a-f]{3})$/i.exec(v);
    const m6 = /^#([0-9a-f]{6})$/i.exec(v);
    if (m6) return `#${m6[1].toLowerCase()}`;
    if (m3) {
        const [a, b, d] = m3[1].toLowerCase().split('');
        return `#${a}${a}${b}${b}${d}${d}`;
    }
    throw new Error('Couleur invalide. Utilise #RRGGBB ou #RGB.');
}

export async function POST(req: Request) {
    try {
        await requireAdmin();
        await dbConnect();

        const body = (await req.json()) as Body;

        const name = (body.name || '').trim();
        if (!name) return NextResponse.json({ ok: false, error: 'missing_name' }, { status: 400 });

        const providedSlug = (body.slug || '').trim();
        const slug = providedSlug ? slugify(providedSlug) : slugify(name);

        const description = (body.description || '').trim();
        const icon = (body.icon || '').trim() || null;

        let color: string | null = null;
        try {
            color = body.color == null ? null : normalizeHexColor(body.color);
        } catch (e) {
            return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'invalid_color' }, { status: 400 });
        }

        let imagePath: string | null = null;
        try {
            imagePath = sanitizeLocalPath(body.imagePath);
        } catch (e) {
            return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'invalid_image_path' }, { status: 400 });
        }

        const imageAlt = (body.imageAlt || '').trim() || null;

        // Unicité du slug (plus de notion d'archives)
        const exists = await CategoryModel.exists({ slug });
        if (exists) {
            return NextResponse.json({ ok: false, error: 'slug_already_exists' }, { status: 409 });
        }

        // Évite l’overload de create() : doc unique + save()
        const doc = new CategoryModel({
            name,
            slug,
            description,
            color,
            icon,
            imagePath,
            imageAlt,
        });
        await doc.save();

        // Revalidate : nouveaux chemins
        revalidatePath('/admin/blog/categories');
        revalidatePath('/admin/blog');
        revalidatePath('/admin/blog/posts/new');

        return NextResponse.json({ ok: true, id: String(doc._id), slug });
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'server_error';
        console.error('POST /api/admin/blog/categories/create failed:', msg);
        return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
}
