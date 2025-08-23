import HeaderClient from './HeaderClient';
import { getSession } from '@/lib/session';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';

type PickUser = { name?: string | null; role?: 'user' | 'admin' };

export default async function Header() {
    const sess = await getSession();
    let displayName: string | null = null;
    let isAdmin = false;

    if (sess?.email) {
        await dbConnect();
        const u = await UserModel.findOne({ email: sess.email }).select({ name: 1, role: 1, _id: 0 }).lean<PickUser>().exec();
        displayName = u?.name ?? null;
        isAdmin = u?.role === 'admin';
    }

    return <HeaderClient isAuthed={!!sess?.email} email={sess?.email ?? null} displayName={displayName} isAdmin={isAdmin} />;
}
