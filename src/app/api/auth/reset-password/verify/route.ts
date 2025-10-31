// src/app/api/auth/reset-password/verify/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { dbConnect } from '@/db/connect';
import { PasswordResetModel } from '@/db/schemas';
import crypto from 'crypto';

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token') || '';
    if (!token) return NextResponse.json({ ok: false }, { status: 400 });
    await dbConnect();
    const tokenHash = hashToken(token);
    const rec = await PasswordResetModel.findOne({ tokenHash, expiresAt: { $gt: new Date() } })
        .select({ _id: 1 })
        .lean()
        .exec();
    return NextResponse.json({ ok: !!rec });
}
