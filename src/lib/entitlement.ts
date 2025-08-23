import { getSession } from '@/lib/session';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import { normalizeProgramSlug } from '@/lib/programs';

type Ok = { ok: true; userId: string; email: string };
type No = { ok: false; reason: 'auth' | 'user' | 'enrollment' };

export async function requireEnrollment(programSlugLike: string): Promise<Ok | No> {
    const sess = await getSession();
    if (!sess?.email) return { ok: false, reason: 'auth' };

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email }).select({ _id: 1, email: 1 }).lean<{ _id: unknown; email: string }>().exec();

    if (!user?._id) return { ok: false, reason: 'user' };

    const slug = normalizeProgramSlug(programSlugLike);
    const enr = await Enrollment.findOne({
        userId: user._id,
        programSlug: slug,
        status: { $in: ['active', 'completed'] },
    })
        .select({ _id: 1 })
        .lean()
        .exec();

    if (!enr) return { ok: false, reason: 'enrollment' };
    return { ok: true, userId: String(user._id), email: user.email };
}
