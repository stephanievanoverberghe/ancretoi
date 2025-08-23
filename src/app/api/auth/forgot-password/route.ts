// app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { UserModel, PasswordResetModel } from '@/db/schemas';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { sendPasswordResetEmail } from '@/lib/mailer'; // active plus tard si tu veux

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

type PickUserId = { _id: Types.ObjectId };

export async function POST(req: Request) {
    const { email } = await req.json().catch(() => ({}));
    const normalized = String(email || '')
        .toLowerCase()
        .trim();

    // Toujours 200 pour ne pas divulguer l’existence d’un compte
    if (!normalized) return NextResponse.json({ ok: true });

    await dbConnect();
    // ⚠️ Assure-toi d'être bien sur findOne (PAS find)
    const user = await UserModel.findOne({ email: normalized, deletedAt: null }).select('_id').lean<PickUserId>().exec();

    if (!user?._id) {
        return NextResponse.json({ ok: true });
    }

    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await PasswordResetModel.create({
        userId: user._id, // Types.ObjectId
        tokenHash,
        expiresAt,
    });

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${raw}`;

    // Active quand prêt :
    await sendPasswordResetEmail(normalized, resetUrl);

    const isProd = process.env.NODE_ENV === 'production';
    return NextResponse.json({ ok: true, ...(isProd ? {} : { devResetUrl: resetUrl }) });
}
