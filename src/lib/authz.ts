// src/lib/authz.ts
import 'server-only';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { getSession } from '@/lib/session';

export async function getCurrentUser() {
    const sess = await getSession();
    if (!sess?.email) return null;
    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email, deletedAt: null }).lean<{
        email: string;
        name?: string | null;
        role: 'user' | 'admin';
        passwordChangedAt?: Date | null;
    }>();
    if (!user) return null;
    if (user.passwordChangedAt && sess.iat && sess.iat * 1000 < new Date(user.passwordChangedAt).getTime()) {
        return null;
    }
    return user;
}

export async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/admin');
    if (user.role !== 'admin') redirect('/');
    return user;
}

// ✅ Nouveau : guard générique utilisateur
export async function requireUser(nextPath: string = '/member') {
    const user = await getCurrentUser();
    if (!user) {
        const next = encodeURIComponent(nextPath);
        redirect(`/login?next=${next}`);
    }
    return user;
}
