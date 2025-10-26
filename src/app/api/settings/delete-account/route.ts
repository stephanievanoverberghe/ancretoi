import 'server-only';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { getSession } from '@/lib/session';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import DayState from '@/models/DayState';
import { Types } from 'mongoose'; // ⬅️ IMPORTANT

export async function POST() {
    try {
        const sess = await getSession();
        if (!sess?.email) return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });

        await dbConnect();

        // ✅ On type le résultat de lean()
        const user = await UserModel.findOne({ email: sess.email }).select({ _id: 1 }).lean<{ _id: Types.ObjectId } | null>().exec();

        if (!user?._id) return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 404 });

        // Soft-delete + purge liée (types cohérents avec tes schémas)
        await Promise.all([
            Enrollment.deleteMany({ userId: String(user._id) }), // Enrollment.userId = string
            DayState.deleteMany({ userId: user._id }), // DayState.userId = ObjectId
            UserModel.updateOne({ _id: user._id }, { $set: { deletedAt: new Date() } }),
        ]);

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 });
    }
}
