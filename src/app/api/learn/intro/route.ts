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

const Body = z.object({
    slug: z.string().trim().min(1),
    engaged: z.boolean(), // true = engage / false = désengage (reset complet)
});

type EnrStatus = 'active' | 'completed' | 'paused';

export async function POST(req: Request) {
    try {
        await dbConnect();

        const user = await requireUser('/learn');
        const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>();

        if (!userDoc?._id) {
            return NextResponse.json({ ok: false as const, error: 'USER_NOT_FOUND' }, { status: 401 });
        }

        let jsonUnknown: unknown;
        try {
            jsonUnknown = await req.json();
        } catch {
            return NextResponse.json({ ok: false as const, error: 'INVALID_JSON' }, { status: 400 });
        }

        const parsed = Body.safeParse(jsonUnknown);
        if (!parsed.success) {
            return NextResponse.json({ ok: false as const, error: 'INVALID_BODY', issues: parsed.error.flatten() }, { status: 400 });
        }

        const programSlug = parsed.data.slug.toLowerCase();
        const engaged = parsed.data.engaged;

        // Pour borner currentDay si besoin
        const last = await Unit.findOne({ programSlug, unitType: 'day', status: 'published' })
            .select({ unitIndex: 1 })
            .sort({ unitIndex: -1 })
            .lean<{ unitIndex: number } | null>();
        const lastPublished = last?.unitIndex ?? 0;

        const userIdObj = userDoc._id;
        const now = new Date();

        if (!engaged) {
            // === DÉSENGAGEMENT → RESET COMPLET ===
            // 1) Efface toutes les pratiques / notes du programme
            await DayState.deleteMany({ userId: userIdObj, programSlug });

            // 2) Réinitialise l’enrollment (J1, statut actif, started/completed null)
            await Enrollment.updateOne(
                { userId: userIdObj, programSlug },
                {
                    $set: {
                        introEngaged: false,
                        currentDay: 1,
                        status: 'active' as EnrStatus,
                        updatedAt: now,
                        startedAt: null,
                        completedAt: null,
                    },
                    $setOnInsert: {
                        userId: userIdObj,
                        programSlug,
                        createdAt: now,
                    },
                },
                { upsert: true }
            );

            return NextResponse.json({
                ok: true as const,
                engaged: false,
                lastPublished,
                reset: true as const, // indicateur côté client si tu veux afficher un toast
            });
        }

        // === ENGAGEMENT → déverrouille J1 (sans avancer) ===
        const nextCurrentDay = Math.max(1, Math.min(lastPublished || 1, 1));
        await Enrollment.updateOne(
            { userId: userIdObj, programSlug },
            {
                $set: {
                    introEngaged: true,
                    currentDay: nextCurrentDay,
                    status: 'active' as EnrStatus,
                    updatedAt: now,
                },
                $setOnInsert: {
                    userId: userIdObj,
                    programSlug,
                    createdAt: now,
                },
            },
            { upsert: true }
        );

        return NextResponse.json({ ok: true as const, engaged: true, lastPublished, reset: false as const });
    } catch (err: unknown) {
        const msg = (err as { message?: string })?.message ?? 'SERVER_ERROR';
        return NextResponse.json({ ok: false as const, error: msg }, { status: 500 });
    }
}
