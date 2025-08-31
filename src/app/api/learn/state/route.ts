// src/app/api/learn/state/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import DayState from '@/models/DayState';

const SliderObj = z
    .object({
        energie: z.number().min(0).max(10).optional(),
        focus: z.number().min(0).max(10).optional(),
        paix: z.number().min(0).max(10).optional(),
        estime: z.number().min(0).max(10).optional(),
    })
    .partial();

const Body = z.object({
    slug: z.string().trim().min(1),
    day: z.number().int().positive(),
    patch: z.object({
        data: z.record(z.string(), z.string()).optional(),
        sliders: SliderObj.optional(), // baseline
        checkout: SliderObj.optional(), // ✅ ajout: checkout
        practiced: z.boolean().optional(),
        mantra3x: z.boolean().optional(),
        completed: z.boolean().optional(),
    }),
});

export async function POST(req: Request) {
    try {
        await dbConnect();
        const user = await requireUser('/learn');

        const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>();

        if (!userDoc?._id) {
            return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 401 });
        }

        const json = await req.json();
        const parsed = Body.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
        }

        const { slug, day, patch } = parsed.data;
        const programSlug = slug.toLowerCase();

        const doc = await DayState.findOneAndUpdate(
            { userId: userDoc._id, programSlug, day },
            {
                $setOnInsert: { createdAt: new Date() },
                $set: {
                    ...(patch.data ? { data: patch.data } : {}),
                    ...(patch.sliders ? { sliders: patch.sliders } : {}),
                    ...(patch.checkout ? { checkout: patch.checkout } : {}), // ✅ persist checkout
                    ...(typeof patch.practiced === 'boolean' ? { practiced: patch.practiced } : {}),
                    ...(typeof patch.mantra3x === 'boolean' ? { mantra3x: patch.mantra3x } : {}),
                    ...(typeof patch.completed === 'boolean' ? { completed: patch.completed } : {}),
                    updatedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        )
            .select({ _id: 1 })
            .lean<{ _id: Types.ObjectId } | null>();

        return NextResponse.json({ ok: true, id: doc?._id ? String(doc._id) : null });
    } catch {
        return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 });
    }
}
