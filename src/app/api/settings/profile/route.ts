import 'server-only';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { getSession } from '@/lib/session';
import { UserModel } from '@/db/schemas';

export async function POST(req: Request) {
    try {
        const sess = await getSession();
        if (!sess?.email) return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });
        const { name } = await req.json();
        if (typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ ok: false, error: 'INVALID_NAME' }, { status: 400 });
        }
        await dbConnect();
        await UserModel.updateOne({ email: sess.email }, { $set: { name: name.trim() } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 });
    }
}
