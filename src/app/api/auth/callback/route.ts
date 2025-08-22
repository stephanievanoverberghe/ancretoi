import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { MagicTokenModel, UserModel } from '@/db/schemas';
import { createSessionToken, setSessionCookie } from '@/lib/session';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const tokenParam = searchParams.get('token');
    const email = searchParams.get('email')?.toLowerCase() || '';
    if (!tokenParam || !email) return new Response('Bad Request', { status: 400 });

    await dbConnect();
    const doc = await MagicTokenModel.findOne({ token: tokenParam, email });

    if (!doc || doc.used || doc.expiresAt < new Date()) {
        return new Response('Link invalid or expired', { status: 400 });
    }

    doc.used = true;
    await doc.save();
    await UserModel.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });

    // 👉 crée le JWT
    const jwt = await createSessionToken(email);

    const redirectTo = doc.next || '/app';
    const res = NextResponse.redirect(new URL(redirectTo, process.env.APP_URL));
    // 👉 pose le cookie sur la réponse
    setSessionCookie(res, jwt);
    return res;
}
