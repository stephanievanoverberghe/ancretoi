import 'server-only';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';

type PlanOk = { ok: true; days: Array<{ index: number; title?: string | null }> };
type PlanErr = { ok: false; error: string };

export async function GET(req: Request, { params }: { params: { slug: string } }) {
    const slug = (params.slug || '').toLowerCase();
    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 50));

    await dbConnect();
    const user = await requireUser(`/learn/${slug}`);
    const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: unknown } | null>();
    if (!userDoc?._id) return NextResponse.json<PlanErr>({ ok: false, error: 'UNAUTH' }, { status: 401 });
    const userId = String(userDoc._id);

    const enr = await Enrollment.findOne({ userId, programSlug: slug }).select({ _id: 1 }).lean<{ _id: unknown } | null>();
    if (!enr?._id) return NextResponse.json<PlanErr>({ ok: false, error: 'NOT_ENROLLED' }, { status: 403 });

    const units = await Unit.find({ programSlug: slug, unitType: 'day', status: 'published' })
        .select({ unitIndex: 1, title: 1 })
        .sort({ unitIndex: 1 })
        .limit(limit)
        .lean<{ unitIndex: number; title?: string | null }[]>();

    const days = units.map((u) => ({ index: u.unitIndex, title: u.title ?? null }));
    return NextResponse.json<PlanOk>({ ok: true, days });
}
