import 'server-only';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';
import ProgramPage from '@/models/ProgramPage';

// Récupère le slug via l'URL (compatible Next 15 / Vercel)
function getSlugFromUrl(url: URL) {
    const parts = url.pathname.split('/'); // ["", "api", "programs", "{slug}", "summary"]
    const i = parts.findIndex((p) => p === 'programs');
    return i >= 0 && parts[i + 1] ? decodeURIComponent(parts[i + 1]).toLowerCase() : '';
}

// Normalise une URL d'image pour Next/Image (ajoute "/" et retire "public/")
function normalizeCoverUrl(u?: string | null): string | null {
    if (!u) return null;
    if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/')) return u;
    return '/' + u.replace(/^public\//, '');
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const slug = getSlugFromUrl(url);
    if (!slug) return NextResponse.json({ error: 'SLUG_MISSING' }, { status: 400 });

    await dbConnect();

    const user = await requireUser(`/learn/${slug}`);
    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: unknown } | null>();
    if (!userDoc?._id) return NextResponse.json({ error: 'UNAUTH' }, { status: 401 });

    const userId = String(userDoc._id);

    const [enr, total, pg] = await Promise.all([
        Enrollment.findOne({ userId, programSlug: slug })
            .select({ status: 1, currentDay: 1 })
            .lean<{ status: 'active' | 'completed' | 'paused'; currentDay?: number | null } | null>(),
        Unit.countDocuments({ programSlug: slug, unitType: 'day', status: 'published' }),
        ProgramPage.findOne({ programSlug: slug }).select({ hero: 1, card: 1, meta: 1 }).lean<{
            hero?: {
                title?: string | null;
                subtitle?: string | null;
                cover?: { url?: string | null; alt?: string | null } | null;
            } | null;
            card?: { image?: { url?: string | null; alt?: string | null } | null } | null;
            meta?: { level?: string | null; durationDays?: number | null; dailyLoadLabel?: string | null } | null;
        } | null>(),
    ]);

    if (!enr) return NextResponse.json({ error: 'NOT_ENROLLED' }, { status: 403 });

    const currentDay = Math.max(1, Math.min(total || 1, enr.currentDay ?? 1));
    const done = enr.status === 'completed' ? total : Math.max(0, currentDay - 1);
    const percent = total ? Math.round((done / total) * 100) : 0;

    // ✅ Fallback: hero.cover → card.image → null + normalisation
    const rawCoverUrl = pg?.hero?.cover?.url ?? pg?.card?.image?.url ?? null;
    const coverUrl = normalizeCoverUrl(rawCoverUrl);
    const coverAlt = pg?.hero?.cover?.alt ?? pg?.card?.image?.alt ?? '';

    return NextResponse.json({
        ok: true,
        programSlug: slug,
        title: pg?.hero?.title ?? slug,
        subtitle: pg?.hero?.subtitle ?? null,
        coverUrl,
        coverAlt,
        total,
        currentDay,
        done,
        percent,
        status: enr.status,
        // meta (utilisée par la modale)
        level: pg?.meta?.level ?? null,
        durationDays: pg?.meta?.durationDays ?? null,
        dailyLoadLabel: pg?.meta?.dailyLoadLabel ?? null,
    });
}
