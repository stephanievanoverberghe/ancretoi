// src/components/Header.tsx
import HeaderClient from './HeaderClient';
import { getSession } from '@/lib/session';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function Header() {
    const sess = await getSession();
    const isAuthed = !!sess?.email;

    if (!isAuthed) {
        return <HeaderClient isAuthed={false} email={null} displayName={null} />;
    }

    await dbConnect();
    const user = await UserModel.findOne({ email: sess!.email }).select({ name: 1, role: 1, email: 1 }).lean<{ name?: string; role?: 'user' | 'admin'; email?: string }>();

    return <HeaderClient isAuthed email={user?.email ?? sess!.email!} displayName={user?.name ?? null} isAdmin={user?.role === 'admin'} />;
}
