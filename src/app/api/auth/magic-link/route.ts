import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { dbConnect } from '@/db/connect';
import { MagicTokenModel } from '@/db/schemas';
import { Resend } from 'resend';

export async function POST(req: Request) {
    const { email, next } = await req.json().catch(() => ({}));
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    await dbConnect();

    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await MagicTokenModel.create({ email: String(email).toLowerCase(), token, expiresAt, next });

    const url = `${process.env.APP_URL}/api/auth/callback?token=${token}&email=${encodeURIComponent(email)}`;

    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: process.env.RESEND_FROM || 'no-reply@ancre-toi.fr',
            to: email,
            subject: 'Your sign-in link — Ancre-toi',
            html: `<p>Click to sign in:</p><p><a href="${url}">${url}</a></p><p>This link expires in 15 minutes.</p>`,
        });
    } else {
        // mode dev sans Resend → log l'URL
        console.log('[DEV] Magic link:', url);
    }

    return NextResponse.json({ ok: true });
}
