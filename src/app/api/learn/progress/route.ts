// src/app/api/learn/progress/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';
import DayState from '@/models/DayState';
import { Types } from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const Body = z.object({
    slug: z.string().trim().min(1),
    action: z.enum(['setDay', 'completeDay']),
    day: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
    try {
        await dbConnect();
        const user = await requireUser('/learn');
        const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>();

        if (!userDoc?._id) {
            return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 401 });
        }

        const parsed = Body.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
        }

        const programSlug = parsed.data.slug.toLowerCase();
        const action = parsed.data.action;
        const requestedDay = parsed.data.day;

        const last = await Unit.findOne({ programSlug, unitType: 'day', status: 'published' })
            .select({ unitIndex: 1 })
            .sort({ unitIndex: -1 })
            .lean<{ unitIndex: number } | null>();

        const lastPublished = last?.unitIndex ?? 0;
        if (lastPublished === 0) {
            return NextResponse.json({ ok: false, error: 'NO_PUBLISHED_UNITS' }, { status: 400 });
        }

        const userId = String(userDoc._id);

        let enr = await Enrollment.findOne({ userId, programSlug }).lean<{ status: 'active' | 'completed' | 'paused'; currentDay?: number | null } | null>();
        if (!enr) {
            await Enrollment.create({ userId, programSlug, status: 'active', currentDay: 1 });
            enr = { status: 'active', currentDay: 1 };
        }

        const current = Math.max(1, Math.min(lastPublished, enr.currentDay ?? 1));

        // ---------- setDay ----------
        if (action === 'setDay') {
            const target = Math.max(1, Math.min(lastPublished, requestedDay ?? 1));
            await Enrollment.updateOne(
                { userId, programSlug },
                {
                    $set: {
                        currentDay: target,
                        status: target >= lastPublished ? 'completed' : 'active',
                        updatedAt: new Date(),
                    },
                }
            );
            return NextResponse.json({
                ok: true,
                currentDay: target,
                lastPublished,
                status: target >= lastPublished ? 'completed' : 'active',
            });
        }

        // ---------- completeDay (avec hard-guard) ----------
        if (action === 'completeDay') {
            const doneDay = Math.max(1, Math.min(lastPublished, requestedDay ?? current));

            // 1) Charger l'état du jour en DB
            const state = await DayState.findOne({
                userId: userDoc._id, // DayState.userId est un ObjectId
                programSlug,
                day: doneDay,
            })
                .select({ practiced: 1, data: 1 })
                .lean<{ practiced?: boolean; data?: Record<string, unknown> } | null>();

            const practiced = !!state?.practiced;

            // 2) Vérifier s'il existe des questions texte ce jour-là
            const unit = await Unit.findOne({
                programSlug,
                unitType: 'day',
                status: 'published',
                unitIndex: doneDay,
            })
                .select({ journalSchema: 1, unitIndex: 1 })
                .lean<{ journalSchema?: { questions?: unknown[] } } | null>();

            const qList = Array.isArray(unit?.journalSchema?.questions) ? (unit!.journalSchema!.questions as unknown[]) : [];
            const hasTextQuestions = qList.length > 0;

            // Au moins une réponse texte non vide si le jour a des questions
            const anyText = hasTextQuestions ? Object.values(state?.data ?? {}).some((v) => typeof v === 'string' && v.trim().length > 0) : true;

            if (!practiced || !anyText) {
                return NextResponse.json({ ok: false, error: 'INCOMPLETE_DAY', requirements: { practiced, anyText } }, { status: 400 });
            }

            // 3) Marquer le DayState comme complété (qualité de données)
            await DayState.updateOne({ userId: userDoc._id, programSlug, day: doneDay }, { $set: { completed: true, updatedAt: new Date() } }, { upsert: false });

            // 4) Avancer l'enrollment comme avant
            const shouldAdvance = doneDay >= current;
            let nextDay = current;
            let status: 'active' | 'completed' = 'active';

            if (shouldAdvance) {
                if (doneDay >= lastPublished) {
                    nextDay = lastPublished;
                    status = 'completed';
                } else {
                    nextDay = doneDay + 1;
                }
                await Enrollment.updateOne({ userId, programSlug }, { $set: { currentDay: nextDay, status, updatedAt: new Date() } });
            }

            return NextResponse.json({
                ok: true,
                currentDay: shouldAdvance ? nextDay : current,
                lastPublished,
                status: shouldAdvance ? status : enr.status,
            });
        }

        return NextResponse.json({ ok: false, error: 'UNKNOWN_ACTION' }, { status: 400 });
    } catch {
        return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 });
    }
}
