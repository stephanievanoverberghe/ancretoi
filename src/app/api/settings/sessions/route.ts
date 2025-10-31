// src/app/api/settings/sessions/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
// TODO: Branche ta vraie source (base, table sessions, etc.)

export async function GET() {
    const sess = await getSession();
    if (!sess?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Exemple de payload attendu par le client
    const sessions = [
        {
            id: 'current',
            isCurrent: true,
            ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desktop',
            ip: null,
            createdAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
        },
    ];

    return new NextResponse(JSON.stringify({ sessions }), {
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
}
