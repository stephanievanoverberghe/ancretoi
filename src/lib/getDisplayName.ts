// src/lib/getDisplayName.ts
import 'server-only';
import { dbConnect } from '@/db/connect';
import { requireUser } from '@/lib/authz';
import { UserModel } from '@/db/schemas';

export async function getDisplayName(redirectTo = '/login?next=/member') {
    await dbConnect();
    const user = await requireUser(redirectTo); // => { email, ... }

    const userDoc = await UserModel.findOne({
        email: user.email,
        deletedAt: null,
    })
        .select({ name: 1 })
        .lean<{ name?: string | null }>();

    // 1) DB
    const raw = (userDoc?.name ?? '').trim();
    if (raw) return raw.split(' ')[0]; // on garde le prénom (ou 1er token)

    // 2) Fallback email local-part
    const local = user.email.split('@')[0] ?? '';
    return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'toi';
}
