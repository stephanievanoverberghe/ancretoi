// src/app/api/learn/state/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import DayState from '@/models/DayState';
import Enrollment from '@/models/Enrollment';

const Body = z.object({
    slug: z.string().trim().min(1),
    day: z.number().int().positive(),
    patch: z.object({
        data: z.record(z.string(), z.string()).optional(),
        practiced: z.boolean().optional(),
        completed: z.boolean().optional(),
    }),
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

        const { slug, day, patch } = parsed.data;
        const programSlug = slug.toLowerCase();

        const doc = await DayState.findOneAndUpdate(
            { userId: userDoc._id, programSlug, day },
            {
                $setOnInsert: { createdAt: new Date() },
                $set: {
                    ...(patch.data ? { data: patch.data } : {}),
                    ...(typeof patch.practiced === 'boolean' ? { practiced: patch.practiced } : {}),
                    ...(typeof patch.completed === 'boolean' ? { completed: patch.completed } : {}),
                    updatedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        )
            .select({ _id: 1 })
            .lean<{ _id: Types.ObjectId } | null>();

        return NextResponse.json({ ok: true as const, id: doc?._id ? String(doc._id) : null });
    } catch {
        return NextResponse.json({ ok: false as const, error: 'SERVER_ERROR' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const slug = (searchParams.get('slug') || '').toLowerCase().trim();
        const all = (searchParams.get('all') || '').trim();
        const dayStr = (searchParams.get('day') || '').trim();

        if (!slug) {
            return NextResponse.json({ ok: false as const, error: 'MISSING_SLUG' }, { status: 400 });
        }

        const user = await requireUser('/learn');
        const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>();

        if (!userDoc?._id) {
            return NextResponse.json({ ok: false as const, error: 'USER_NOT_FOUND' }, { status: 401 });
        }

        if (all === '1') {
            const res = await DayState.deleteMany({ userId: userDoc._id, programSlug: slug });
            await Enrollment.updateOne({ userId: String(userDoc._id), programSlug: slug }, { $set: { currentDay: 1, status: 'active', updatedAt: new Date() } }, { upsert: true });
            return NextResponse.json({
                ok: true as const,
                scope: 'all' as const,
                deleted: res.deletedCount ?? 0,
                currentDay: 1,
                status: 'active' as const,
            });
        }

        const day = Number(dayStr || '0');
        if (!Number.isFinite(day) || day < 1) {
            return NextResponse.json({ ok: false as const, error: 'INVALID_DAY' }, { status: 400 });
        }

        const res = await DayState.deleteOne({ userId: userDoc._id, programSlug: slug, day });
        await Enrollment.updateOne({ userId: String(userDoc._id), programSlug: slug }, { $set: { currentDay: day, status: 'active', updatedAt: new Date() } }, { upsert: true });

        return NextResponse.json({
            ok: true as const,
            scope: 'one' as const,
            day,
            deleted: res.deletedCount ?? 0,
            currentDay: day,
            status: 'active' as const,
        });
    } catch {
        return NextResponse.json({ ok: false as const, error: 'SERVER_ERROR' }, { status: 500 });
    }
}
