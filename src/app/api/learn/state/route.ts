import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Types } from 'mongoose';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';
import DayState from '@/models/DayState';
import Enrollment from '@/models/Enrollment';

/* ----------------------------- Zod Schemas ----------------------------- */
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
        checkout: SliderObj.optional(), // ✅ conservé
        practiced: z.boolean().optional(),
        mantra3x: z.boolean().optional(),
        completed: z.boolean().optional(),
    }),
});

/* --------------------------------- POST --------------------------------
   Sauvegarde/incrémente l'état du jour (notes, sliders, practiced, etc.)
--------------------------------------------------------------------------- */
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
                    ...(patch.checkout ? { checkout: patch.checkout } : {}),
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

/* ------------------------------- DELETE ---------------------------------
   Deux modes :
   1) Supprimer un jour :  ?slug=...&day=3
      - supprime le DayState ciblé
      - remet l’enrollment sur ce jour (currentDay = day, status = 'active')
   2) Supprimer tout le programme : ?slug=...&all=1
      - supprime tous les DayState du programme pour l'utilisateur
      - remet l’enrollment à Jour 1 (status = 'active')

   NB: si 'all=1' est présent, il prend le dessus sur 'day'.
--------------------------------------------------------------------------- */
export async function DELETE(req: Request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const slug = (searchParams.get('slug') || '').toLowerCase().trim();
        const all = (searchParams.get('all') || '').trim();
        const dayStr = (searchParams.get('day') || '').trim();

        if (!slug) {
            return NextResponse.json({ ok: false, error: 'MISSING_SLUG' }, { status: 400 });
        }

        const user = await requireUser('/learn');
        const userDoc = await UserModel.findOne({ email: user.email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>();

        if (!userDoc?._id) {
            return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 401 });
        }

        // ----- Wipe complet du programme -----
        if (all === '1') {
            const res = await DayState.deleteMany({ userId: userDoc._id, programSlug: slug });

            // remet l’enrollment à J1 / active (créé si absent)
            await Enrollment.updateOne({ userId: String(userDoc._id), programSlug: slug }, { $set: { currentDay: 1, status: 'active', updatedAt: new Date() } }, { upsert: true });

            return NextResponse.json({
                ok: true,
                scope: 'all',
                deleted: res.deletedCount ?? 0,
                currentDay: 1,
                status: 'active',
            });
        }

        // ----- Suppression d'un jour -----
        const day = Number(dayStr || '0');
        if (!Number.isFinite(day) || day < 1) {
            return NextResponse.json({ ok: false, error: 'INVALID_DAY' }, { status: 400 });
        }

        const res = await DayState.deleteOne({ userId: userDoc._id, programSlug: slug, day });

        // remet l’enrollment sur ce jour (le client décide de rediriger J-1/intro)
        await Enrollment.updateOne({ userId: String(userDoc._id), programSlug: slug }, { $set: { currentDay: day, status: 'active', updatedAt: new Date() } }, { upsert: true });

        return NextResponse.json({
            ok: true,
            scope: 'one',
            day,
            deleted: res.deletedCount ?? 0,
            currentDay: day,
            status: 'active',
        });
    } catch {
        return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 });
    }
}
