// src/app/api/settings/sessions/[id]/revoke/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(_: Request, { params }: { params: { id: string } }) {
    const sess = await getSession();
    if (!sess?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // TODO: révoquer la session côté serveur (params.id)
    // Ex: await revokeUserSession(sess.email, params.id);

    return new NextResponse(JSON.stringify({ ok: true, revoked: params.id }), {
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
}
