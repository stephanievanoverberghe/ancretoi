// src/app/api/settings/sessions/[id]/revoke/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(req: Request, context: unknown) {
    const sess = await getSession();
    if (!sess?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // On récupère params sans typer la signature
    const { params } = context as { params: { id: string } };
    const id = params.id;

    // TODO: révoquer la session côté serveur (id)
    // await revokeUserSession(sess.email, id);

    return new NextResponse(JSON.stringify({ ok: true, revoked: id }), {
        headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
        },
    });
}
