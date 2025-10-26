// src/app/api/programs/[slug]/plan/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Unit from '@/models/Unit';

// Helper pour contourner l'avertissement Next 15 sur params sync
function getSlugFromUrl(u: URL) {
    const parts = u.pathname.split('/'); // ["", "api", "programs", "{slug}", "plan"]
    const i = parts.findIndex((p) => p === 'programs');
    return i >= 0 && parts[i + 1] ? decodeURIComponent(parts[i + 1]).toLowerCase() : '';
}

// Sélection minimale : on tente plusieurs champs possibles
type LeanUnit = {
    title?: string | null;
    name?: string | null;
    hero?: { title?: string | null } | null;
    day?: number | null;
    index?: number | null;
    order?: number | null;
};

export async function GET(req: Request) {
    const url = new URL(req.url);
    const slug = getSlugFromUrl(url);
    if (!slug) return NextResponse.json({ ok: false, error: 'SLUG_MISSING', days: [] });

    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 50));

    await dbConnect();

    // Auth (tu ne veux montrer le plan qu'aux inscrits)
    const user = await requireUser(`/learn/${slug}`);
    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: unknown } | null>();
    if (!userDoc?._id) return NextResponse.json({ ok: false, error: 'UNAUTH', days: [] }, { status: 401 });

    // Récupère les unités "day" publiées
    const units = await Unit.find({ programSlug: slug, unitType: 'day', status: 'published' })
        .select({ title: 1, name: 1, hero: 1, day: 1, index: 1, order: 1 })
        // On essaie de trier par les champs usuels, avec fallback
        .sort({ day: 1, index: 1, order: 1, _id: 1 })
        .limit(limit)
        .lean<LeanUnit[]>();

    const days = (units || []).map((u, i) => {
        const idx =
            (typeof u.day === 'number' && u.day > 0 && Number.isFinite(u.day) && Math.floor(u.day)) ||
            (typeof u.index === 'number' && u.index > 0 && Number.isFinite(u.index) && Math.floor(u.index)) ||
            (typeof u.order === 'number' && Number.isFinite(u.order) && Math.max(1, Math.floor(u.order))) ||
            i + 1;

        const title = u.title ?? u.name ?? u.hero?.title ?? null;

        return { index: Number(idx), title };
    });

    return NextResponse.json({ ok: true, days });
}
