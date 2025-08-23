// lib/entitlement.ts
import { getSession } from '@/lib/session';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import Enrollment from '@/models/Enrollment';
import { normalizeProgramSlug } from '@/lib/programs';

/** Jours offerts (preview) par programme — mais UNIQUEMENT pour utilisateurs CONNECTÉS */
const PUBLIC_PREVIEW: Record<string, number[]> = {
    'reset-7': [1],
    // 'boussole-10': [1],
    // 'ancrage-30': [1],
    // 'alchimie-90': [1],
};

type AccessOK = { ok: true; mode: 'enrolled'; userId: string; email: string } | { ok: true; mode: 'preview'; userId: string; email: string };

type AccessNO = { ok: false; reason: 'auth' | 'user' | 'not_allowed' | 'enrollment' };

/**
 * Exige d’être connecté.
 * - Si inscrit → accès total
 * - Sinon, accès seulement si dayNum ∈ PUBLIC_PREVIEW[slug]
 */
export async function requireEnrollmentOrPreview(programSlugLike: string, dayNum: number): Promise<AccessOK | AccessNO> {
    const sess = await getSession();
    if (!sess?.email) return { ok: false, reason: 'auth' };

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email }).select({ _id: 1, email: 1 }).lean<{ _id: unknown; email: string }>().exec();

    if (!user?._id) return { ok: false, reason: 'user' };

    const slug = normalizeProgramSlug(programSlugLike);

    // Déjà inscrit ?
    const enr = (await Enrollment.findOne({
        userId: user._id,
        programSlug: slug,
        status: { $in: ['active', 'completed'] },
    })
        .select({ _id: 1 })
        .lean()
        .exec()) as { _id: unknown } | null;

    // ✔️ S'il y a un doc, l'utilisateur est inscrit
    if (enr) {
        return { ok: true, mode: 'enrolled', userId: String(user._id), email: user.email };
    }

    // ❌ Pas inscrit → preview seulement si autorisé ET connecté
    const allowed = PUBLIC_PREVIEW[slug] ?? [];
    if (allowed.includes(dayNum)) {
        return { ok: true, mode: 'preview', userId: String(user._id), email: user.email };
    }

    return { ok: false, reason: 'not_allowed' };
}
