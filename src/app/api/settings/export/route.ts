// src/app/api/settings/export/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { getSession } from '@/lib/session';
import { UserModel } from '@/db/schemas';

export async function POST() {
    const sess = await getSession();
    if (!sess?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await UserModel.findOne({ email: sess.email })
        .select({ email: 1, name: 1, avatarUrl: 1, theme: 1, marketing: 1, productUpdates: 1, createdAt: 1, updatedAt: 1, _id: 0 })
        .lean();

    const payload = {
        exportedAt: new Date().toISOString(),
        account: user,
    };

    const body = JSON.stringify(payload, null, 2);
    return new NextResponse(body, {
        status: 200,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'content-disposition': 'attachment; filename="ancretoi-export.json"',
            'cache-control': 'no-store',
        },
    });
}
