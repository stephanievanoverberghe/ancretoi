import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { createSessionToken, setSessionCookie } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    const { email, name, password, next } = await req.json().catch(() => ({}));
    const normalized = String(email || '')
        .toLowerCase()
        .trim();
    const pwd = String(password || '');

    if (!normalized || !pwd) {
        return NextResponse.json({ error: 'email et mot de passe requis' }, { status: 400 });
    }
    if (pwd.length < 8) {
        return NextResponse.json({ error: 'Mot de passe trop court (min 8 caractères)' }, { status: 400 });
    }

    await dbConnect();

    const existing = await UserModel.findOne({ email: normalized }).select({ _id: 1, passwordHash: 1 }).lean<{ _id: string; passwordHash?: string | null }>();

    if (existing?.passwordHash) {
        return NextResponse.json({ error: 'Cet e-mail est déjà associé à un compte.', code: 'EMAIL_IN_USE' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(pwd, 12);

    if (existing) {
        await UserModel.updateOne({ _id: existing._id }, { $set: { name: (name || '').trim() || null, passwordHash } });
    } else {
        await UserModel.create({ email: normalized, name: (name || '').trim() || null, passwordHash, role: 'user' });
    }

    const jwt = await createSessionToken(normalized);
    const res = NextResponse.json({ ok: true, redirectTo: next || '/member' });
    setSessionCookie(res, jwt);
    return res;
}
