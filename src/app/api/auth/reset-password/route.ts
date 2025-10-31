// src/app/api/auth/reset-password/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { dbConnect } from '@/db/connect';
import { UserModel, PasswordResetModel } from '@/db/schemas';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { isPasswordAcceptable } from '@/lib/password';
import { Types } from 'mongoose';

const CSRF_COOKIE = 'csrf_token';

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

type Body = { token?: string; password?: string };

export async function POST(req: NextRequest) {
    // CSRF
    const csrfHeader = req.headers.get('x-csrf-token') || '';
    const csrfCookie = req.cookies.get(CSRF_COOKIE)?.value || '';
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        return NextResponse.json({ error: 'CSRF invalide' }, { status: 403 });
    }

    let body: Body | null = null;
    try {
        body = (await req.json()) as Body; // pas de any
    } catch {
        return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const token = String(body?.token || '');
    const password = String(body?.password || '');

    if (!token || !password) return NextResponse.json({ error: 'Champs requis' }, { status: 400 });

    await dbConnect();

    // retrouve le reset record
    const tokenHash = hashToken(token);
    const rec = await PasswordResetModel.findOne({ tokenHash })
        .select({ _id: 1, userId: 1, expiresAt: 1 })
        .lean<{ _id: string; userId: Types.ObjectId; expiresAt: Date }>() // ⬅️ Types.ObjectId au lieu de any
        .exec();

    if (!rec || rec.expiresAt <= new Date()) {
        return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 });
    }

    // charge l’email/nom du user pour la politique de mot de passe
    const user = await UserModel.findById(rec.userId).select({ email: 1, name: 1 }).lean<{ email: string; name?: string | null }>().exec();

    if (!user) {
        // par sécurité, on invalide le token
        await PasswordResetModel.deleteOne({ _id: rec._id });
        return NextResponse.json({ error: 'Lien invalide' }, { status: 400 });
    }

    const check = isPasswordAcceptable(password, user.email, user.name || undefined);
    if (!check.ok) {
        return NextResponse.json(
            { error: 'Mot de passe trop faible (12+ avec Aa0!, pas de suites/répétitions/nom/email).', issues: check.issues, code: 'WEAK_PASSWORD' },
            { status: 400 }
        );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await UserModel.updateOne({ _id: rec.userId }, { $set: { passwordHash } });

    // invalide TOUS les tokens restants pour ce user
    await PasswordResetModel.deleteMany({ userId: rec.userId });

    return NextResponse.json({ ok: true });
}
