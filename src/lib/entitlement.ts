// Garde d'accès centralisée : vérifie que l'utilisateur courant a bien acheté le programme
import { getSession } from '@/lib/session';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';

export async function requireEnrollment(programSlug: string) {
    const sess = await getSession();
    if (!sess?.email) return { ok: false as const, reason: 'auth' as const };

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email }).select({ _id: 1, email: 1 }).lean<{ _id: unknown; email: string }>();
    if (!user?._id) return { ok: false as const, reason: 'user' as const };

    const enr = await Enrollment.findOne({
        userId: user._id,
        programSlug,
        status: { $in: ['active', 'completed'] },
    })
        .select({ _id: 1, status: 1 })
        .lean();
    if (!enr) return { ok: false as const, reason: 'enrollment' as const };

    return { ok: true as const, userId: String(user._id), email: user.email };
}
