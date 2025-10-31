// src/app/api/settings/password/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { dbConnect } from '@/db/connect';
import { getSession } from '@/lib/session';
import { UserModel } from '@/db/schemas';
import bcrypt from 'bcryptjs';
import { isPasswordAcceptable } from '@/lib/password';

const CSRF_COOKIE = 'csrf_token';

export async function POST(req: NextRequest) {
    const sess = await getSession();
    if (!sess?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // CSRF double-submit
    const csrfHeader = req.headers.get('x-csrf-token') || '';
    const csrfCookie = req.cookies.get(CSRF_COOKIE)?.value || '';
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        return NextResponse.json({ error: 'CSRF invalide' }, { status: 403 });
    }

    type Body = { current?: string; password?: string };
    let body: Body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const current = String(body.current || '');
    const next = String(body.password || '');
    if (!current || !next) return NextResponse.json({ error: 'Champs requis' }, { status: 400 });

    await dbConnect();

    const user = await UserModel.findOne({ email: sess.email })
        .select({ passwordHash: 1, email: 1, name: 1 })
        .lean<{ passwordHash?: string | null; email: string; name?: string | null }>();
    if (!user?.passwordHash) return NextResponse.json({ error: 'Compte invalide' }, { status: 400 });

    const ok = await bcrypt.compare(current, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });

    const check = isPasswordAcceptable(next, user.email, user.name || undefined);
    if (!check.ok) return NextResponse.json({ error: 'Mot de passe trop faible', issues: check.issues }, { status: 400 });

    const passwordHash = await bcrypt.hash(next, 12);
    await UserModel.updateOne({ email: sess.email }, { $set: { passwordHash } });

    return NextResponse.json({ ok: true });
}
