import 'server-only';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { getSession } from '@/lib/session';
import { UserModel } from '@/db/schemas';

export async function POST(req: Request) {
    try {
        const sess = await getSession();
        if (!sess?.email) return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });

        const body = await req.json();
        const theme = ['system', 'light', 'dark'].includes(body?.theme) ? body.theme : 'system';
        const marketing = !!body?.marketing;
        const productUpdates = !!body?.productUpdates;

        await dbConnect();
        await UserModel.updateOne({ email: sess.email }, { $set: { theme, marketing, productUpdates } });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 });
    }
}
