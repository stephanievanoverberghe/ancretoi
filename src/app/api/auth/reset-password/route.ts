// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { PasswordResetModel, UserModel } from '@/db/schemas';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

type ResetEntry = {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    expiresAt: Date;
    usedAt?: Date | null;
};

export async function POST(req: Request) {
    const { token, password } = await req.json().catch(() => ({}));
    const raw = String(token || '');
    const pwd = String(password || '');

    if (!raw || !pwd) {
        return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
    }
    if (pwd.length < 8) {
        return NextResponse.json({ error: 'Mot de passe trop court (min 8 caractères).' }, { status: 400 });
    }

    await dbConnect();
    const tokenHash = hashToken(raw);

    const entry = await PasswordResetModel.findOne({ tokenHash }).lean<ResetEntry>().exec();

    if (!entry || entry.usedAt || new Date(entry.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(pwd, 12);
    await UserModel.updateOne({ _id: entry.userId }, { $set: { passwordHash, passwordChangedAt: new Date() } });

    await PasswordResetModel.updateOne({ _id: entry._id }, { $set: { usedAt: new Date() } });

    return NextResponse.json({ ok: true });
}
