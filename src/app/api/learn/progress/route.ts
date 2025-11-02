import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import Unit from '@/models/Unit';
import DayState from '@/models/DayState';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type EnrStatus = 'active' | 'completed' | 'paused';

const Body = z.object({
    slug: z.string().trim().min(1),
    action: z.enum(['setDay', 'completeDay', 'reopenDay']),
    day: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
    try {
        await dbConnect();

        const user = await requireUser('/learn');
        const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>();

        if (!userDoc?._id) {
            return NextResponse.json({ ok: false as const, error: 'USER_NOT_FOUND' }, { status: 401 });
        }

        const json: unknown = await req.json();
        const parsed = Body.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({ ok: false as const, error: 'INVALID_BODY' }, { status: 400 });
        }

        const programSlug = parsed.data.slug.toLowerCase();
        const action = parsed.data.action;
        const requestedDay = parsed.data.day;

        // Dernier jour publié
        const last = await Unit.findOne({ programSlug, unitType: 'day', status: 'published' })
            .select({ unitIndex: 1 })
            .sort({ unitIndex: -1 })
            .lean<{ unitIndex: number } | null>();

        const lastPublished = last?.unitIndex ?? 0;
        if (lastPublished === 0) {
            return NextResponse.json({ ok: false as const, error: 'NO_PUBLISHED_UNITS' }, { status: 400 });
        }

        const userId = String(userDoc._id);

        // Enrollment (upsert pour robustesse)
        let enr = await Enrollment.findOne({ userId, programSlug })
            .select({ status: 1, currentDay: 1, startedAt: 1 })
            .lean<{ status: EnrStatus; currentDay?: number | null; startedAt?: Date | null } | null>();

        if (!enr) {
            await Enrollment.create({ userId, programSlug, status: 'active', currentDay: 1 });
            enr = { status: 'active', currentDay: 1, startedAt: null as unknown as Date | null };
        }

        const current = Math.max(1, Math.min(lastPublished, enr.currentDay ?? 1));

        // === setDay ===
        if (action === 'setDay') {
            const targetRaw = requestedDay ?? 1;
            const target = Math.max(1, Math.min(lastPublished, targetRaw));
            const status: EnrStatus = target >= lastPublished ? 'completed' : 'active';

            await Enrollment.updateOne(
                { userId, programSlug },
                {
                    $set: {
                        currentDay: target,
                        status,
                        updatedAt: new Date(),
                        // ✅ marque l'intro validée si première fois
                        ...(enr?.startedAt ? {} : { startedAt: new Date() }),
                    },
                }
            );

            return NextResponse.json({ ok: true as const, currentDay: target, lastPublished, status });
        }

        // === completeDay ===
        if (action === 'completeDay') {
            const doneDayRaw = requestedDay ?? current;
            const doneDay = Math.max(1, Math.min(lastPublished, doneDayRaw));

            // Vérifie la pratique avant validation
            const state = await DayState.findOne({ userId: userDoc._id, programSlug, day: doneDay }).select({ practiced: 1 }).lean<{ practiced?: boolean } | null>();

            if (!state?.practiced) {
                return NextResponse.json({ ok: false as const, error: 'INCOMPLETE_DAY', requirements: { practiced: !!state?.practiced } }, { status: 400 });
            }

            await DayState.updateOne({ userId: userDoc._id, programSlug, day: doneDay }, { $set: { completed: true, updatedAt: new Date() } });

            // Avance le focus si on vient d'atteindre/dépasser l'actuel
            const shouldAdvance = doneDay >= current;
            let nextDay = current;
            let status: EnrStatus = 'active';

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
                ok: true as const,
                currentDay: shouldAdvance ? nextDay : current,
                lastPublished,
                status: shouldAdvance ? status : enr.status,
            });
        }

        // === reopenDay (≃ uncomplete) ===
        // Recalcule currentDay = max(jour complété) + 1 ; si aucun complété => 1 (intro)
        if (action === 'reopenDay') {
            const maxCompleted = await DayState.findOne({
                userId: userDoc._id,
                programSlug,
                completed: true,
            })
                .select({ day: 1 })
                .sort({ day: -1 })
                .lean<{ day: number } | null>();

            const maxDay = maxCompleted?.day ?? 0;
            const computed = Math.max(1, Math.min(lastPublished, maxDay + 1));

            await Enrollment.updateOne({ userId, programSlug }, { $set: { currentDay: computed, status: 'active' as EnrStatus, updatedAt: new Date() } });

            const toIntro = maxDay === 0; // si rien de complété → retour intro

            return NextResponse.json({
                ok: true as const,
                currentDay: computed,
                lastPublished,
                status: 'active' as const,
                toIntro,
            });
        }

        return NextResponse.json({ ok: false as const, error: 'UNKNOWN_ACTION' }, { status: 400 });
    } catch {
        return NextResponse.json({ ok: false as const, error: 'SERVER_ERROR' }, { status: 500 });
    }
}
