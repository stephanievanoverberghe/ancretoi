import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { createSessionToken, setSessionCookie } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    const { email, password, next } = await req.json().catch(() => ({}));
    const normalized = String(email || '')
        .toLowerCase()
        .trim();
    if (!normalized || !password) {
        return NextResponse.json({ error: 'email et mot de passe requis' }, { status: 400 });
    }

    await dbConnect();
    const user = await UserModel.findOne({ email: normalized }).lean<{ email: string; passwordHash?: string | null }>();
    if (!user) {
        return NextResponse.json({ error: 'Compte introuvable', code: 'NO_ACCOUNT' }, { status: 404 });
    }
    if (!user.passwordHash) {
        return NextResponse.json({ error: 'Ce compte n’a pas encore de mot de passe.', code: 'NO_PASSWORD' }, { status: 409 });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
        return NextResponse.json({ error: 'Identifiants invalides', code: 'BAD_CREDENTIALS' }, { status: 401 });
    }

    const jwt = await createSessionToken(user.email);
    const res = NextResponse.json({ ok: true, redirectTo: next || '/member' });
    setSessionCookie(res, jwt);
    return res;
}
