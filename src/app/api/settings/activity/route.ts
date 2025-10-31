// src/app/api/settings/activity/route.ts

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
    const sess = await getSession();
    if (!sess?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Renvoie la forme attendue par ActivityLogClient
    const items = [
        { id: '1', at: new Date().toISOString(), type: 'prefs' as const, note: 'Thème: dark', ip: null },
        { id: '2', at: new Date(Date.now() - 3600_000).toISOString(), type: 'session' as const, note: 'Connexion web', ip: '192.0.2.10' },
    ];

    return new NextResponse(JSON.stringify({ items }), {
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
}
