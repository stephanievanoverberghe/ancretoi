import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';

const BodySchema = z.object({
    slug: z.string().trim().min(1),
    action: z.enum(['complete', 'setDay']),
    day: z.number().int().positive(),
});

type EnrollmentStatus = 'active' | 'completed' | 'paused';
type EnrollmentLean = { currentDay?: number | null; status: EnrollmentStatus } | null;
type EnrollmentUpdate = {
    currentDay: number;
    status: EnrollmentStatus;
    completedAt?: Date;
};

export async function POST(req: Request) {
    try {
        await dbConnect();
        const user = await requireUser('/learn');
        const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: unknown } | null>();

        if (!userDoc?._id) {
            return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 401 });
        }

        const json = await req.json();
        const parsed = BodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
        }

        const programSlug = parsed.data.slug.toLowerCase();
        const day = parsed.data.day;

        const totalDays = await Unit.countDocuments({ programSlug, unitType: 'day' });
        if (totalDays === 0) {
            return NextResponse.json({ ok: false, error: 'NO_CONTENT' }, { status: 400 });
        }

        const enroll = await Enrollment.findOne({ userId: userDoc._id, programSlug }).select({ currentDay: 1, status: 1 }).lean<EnrollmentLean>();

        const current = enroll?.currentDay ?? 1;
        let nextDay = current;
        let completed = false;

        if (parsed.data.action === 'setDay') {
            nextDay = Math.max(1, Math.min(totalDays, day));
        } else {
            // action === 'complete'
            nextDay = Math.max(current, Math.min(totalDays, day + 1));
            completed = nextDay > totalDays || day >= totalDays;
            if (completed) nextDay = totalDays;
        }

        const update: EnrollmentUpdate = { currentDay: nextDay, status: 'active' };
        if (completed) {
            update.status = 'completed';
            update.completedAt = new Date();
        }

        await Enrollment.updateOne({ userId: userDoc._id, programSlug }, { $set: update, $setOnInsert: { startedAt: new Date() } }, { upsert: true });

        return NextResponse.json({ ok: true, nextDay: completed ? null : nextDay, completed });
    } catch {
        return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 });
    }
}
