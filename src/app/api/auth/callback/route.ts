import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { MagicTokenModel, UserModel } from '@/db/schemas';
import { createSessionToken, setSessionCookie } from '@/lib/session';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email')?.toLowerCase() || '';
    if (!token || !email) return new Response('Requête invalide', { status: 400 });

    await dbConnect();
    const doc = await MagicTokenModel.findOne({ token, email });
    if (!doc || doc.used || doc.expiresAt < new Date()) {
        return new Response('Lien invalide ou expiré', { status: 400 });
    }

    doc.used = true;
    await doc.save();
    await UserModel.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });

    const jwt = await createSessionToken(email);
    const redirectTo = doc.next || '/app';
    const res = NextResponse.redirect(new URL(redirectTo, req.url)); // URL absolue
    setSessionCookie(res, jwt);
    return res;
}
