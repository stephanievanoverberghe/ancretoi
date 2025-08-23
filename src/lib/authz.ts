import 'server-only';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { getSession } from '@/lib/session';

export async function getCurrentUser() {
    const sess = await getSession();
    if (!sess?.email) return null;
    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email, deletedAt: null }).lean();
    return user as { email: string; name?: string | null; role: 'user' | 'admin' } | null;
}

export async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/admin');
    if (user.role !== 'admin') redirect('/'); // ou /403 si tu as une page dédiée
    return user;
}
