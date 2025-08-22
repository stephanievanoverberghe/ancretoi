import HeaderClient from './HeaderClient';
import { getSession } from '@/lib/session';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';

type NameOnly = { name?: string | null };

export default async function Header() {
    const sess = await getSession();
    let displayName: string | null = null;

    if (sess?.email) {
        await dbConnect();
        const u = await UserModel.findOne({ email: sess.email }).select({ name: 1, _id: 0 }).lean<NameOnly>().exec();
        displayName = u?.name ?? null;
    }

    return <HeaderClient isAuthed={!!sess?.email} email={sess?.email ?? null} displayName={displayName} />;
}
