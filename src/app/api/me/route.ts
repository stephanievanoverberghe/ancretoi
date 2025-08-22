import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { getSession } from '@/lib/session';

type PublicUser = { email: string; name?: string | null; role?: string | null };

export async function GET() {
    const sess = await getSession();
    if (!sess?.email) return NextResponse.json({ user: null }, { status: 401 });

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email }).select({ email: 1, name: 1, role: 1, _id: 0 }).lean<PublicUser>().exec();

    return NextResponse.json({ user: user ?? null });
}
