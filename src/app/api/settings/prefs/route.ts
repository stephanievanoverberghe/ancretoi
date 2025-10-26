// src/app/api/settings/prefs/route.ts
import 'server-only';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { getSession } from '@/lib/session';
import { UserModel } from '@/db/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
    theme?: 'system' | 'light' | 'dark';
    marketing?: boolean;
    productUpdates?: boolean;
};

export async function POST(req: Request): Promise<Response> {
    try {
        const sess = await getSession();
        if (!sess?.email) {
            return NextResponse.json({ ok: false, error: 'UNAUTH' }, { status: 401 });
        }

        const json = (await req.json()) as Body;

        await dbConnect();
        await UserModel.updateOne(
            { email: sess.email },
            {
                $set: {
                    ...(json.theme ? { theme: json.theme } : {}),
                    ...(typeof json.marketing === 'boolean' ? { marketing: json.marketing } : {}),
                    ...(typeof json.productUpdates === 'boolean' ? { productUpdates: json.productUpdates } : {}),
                    updatedAt: new Date(),
                },
            }
        );

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('POST /api/settings/prefs failed', err);
        return NextResponse.json({ ok: false, error: 'SERVER_ERROR' }, { status: 500 });
    }
}
