import 'server-only';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';
import ProgramPage from '@/models/ProgramPage';

type Data = {
    ok: true;
    programSlug: string;
    title: string;
    subtitle: string | null;
    coverUrl: string | null;
    coverAlt: string | null;
    total: number;
    currentDay: number; // 1-based
    done: number; // jours terminés
    percent: number; // 0..100
    status: 'active' | 'completed' | 'paused';
    level?: string | null;
    durationDays?: number | null;
    dailyLoadLabel?: string | null;
};

export async function GET(_: Request, { params }: { params: { slug: string } }) {
    const slug = (params.slug || '').toLowerCase();
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
            hero?: { title?: string | null; subtitle?: string | null; cover?: { url?: string | null; alt?: string | null } | null } | null;
            card?: { image?: { url?: string | null; alt?: string | null } | null } | null;
            meta?: { level?: string | null; durationDays?: number | null; dailyLoadLabel?: string | null } | null;
        } | null>(),
    ]);

    if (!enr) return NextResponse.json({ error: 'NOT_ENROLLED' }, { status: 403 });

    const currentDay = Math.max(1, Math.min(total || 1, enr.currentDay ?? 1));
    const done = enr.status === 'completed' ? total : Math.max(0, currentDay - 1);
    const percent = total ? Math.round((done / total) * 100) : 0;

    const coverUrl = pg?.hero?.cover?.url ?? pg?.card?.image?.url ?? null;
    const coverAlt = pg?.hero?.cover?.alt ?? pg?.card?.image?.alt ?? '';

    const payload: Data = {
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
        level: pg?.meta?.level ?? null,
        durationDays: pg?.meta?.durationDays ?? null,
        dailyLoadLabel: pg?.meta?.dailyLoadLabel ?? null,
    };

    return NextResponse.json(payload);
}
