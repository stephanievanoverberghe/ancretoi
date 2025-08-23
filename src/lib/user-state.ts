// lib/user-state.ts
import 'server-only';
import { dbConnect } from '@/db/connect';
import { getSession } from '@/lib/session';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';

/** Renvoie l’état utile pour le CTA du teaser. */
export async function getUserState() {
    const sess = await getSession();
    const email = sess?.email ?? null;

    if (!email) {
        return {
            isAuthed: false,
            hasActiveProgram: false,
            activeProgramSlug: null as string | null,
        };
    }

    await dbConnect();

    const user = await UserModel.findOne({ email, deletedAt: null }).select({ _id: 1 }).lean<{ _id: unknown }>().exec();

    if (!user?._id) {
        return {
            isAuthed: false,
            hasActiveProgram: false,
            activeProgramSlug: null,
        };
    }

    // Un seul programme actif suffit pour personnaliser le CTA.
    const enr = await Enrollment.findOne({
        userId: user._id,
        status: { $in: ['active'] },
    })
        .select({ programSlug: 1 })
        .lean<{ programSlug?: string }>()
        .exec();

    return {
        isAuthed: true,
        hasActiveProgram: !!enr,
        activeProgramSlug: enr?.programSlug ?? null,
    };
}
