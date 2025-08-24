// src/app/api/newsletter/subscribe/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import Newsletter from '@/models/Newsletter';
import { Resend } from 'resend';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function assertEnv() {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM || !process.env.APP_URL) {
        throw new Error('Missing RESEND_API_KEY / RESEND_FROM / APP_URL');
    }
}

// Singleton paresseux pour éviter l’instanciation au build
let _resend: Resend | null = null;
function getResend(): Resend {
    const key = process.env.RESEND_API_KEY!;
    if (!_resend) _resend = new Resend(key);
    return _resend;
}

export async function POST(req: Request) {
    try {
        assertEnv();
        await dbConnect();

        const body = await req.json().catch(() => ({} as Record<string, unknown>));
        const email = String(body?.email ?? '')
            .trim()
            .toLowerCase();
        const source = String(body?.source ?? 'site');

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
        }

        const confirmToken = crypto.randomBytes(32).toString('hex');
        const unsubToken = crypto.randomBytes(32).toString('hex');

        await Newsletter.findOneAndUpdate(
            { email },
            {
                $set: {
                    email,
                    status: 'pending',
                    source,
                    confirmToken,
                    unsubToken,
                    consentAt: null,
                    meta: {
                        ip: req.headers.get('x-forwarded-for') ?? null,
                        userAgent: req.headers.get('user-agent') ?? null,
                    },
                },
                $setOnInsert: { tags: [] },
            },
            { new: true, upsert: true, runValidators: false }
        ).lean();

        const APP_URL = process.env.APP_URL!;
        const FROM = process.env.RESEND_FROM!;

        const confirmUrl = `${APP_URL}/api/newsletter/confirm?token=${confirmToken}`;
        const unsubUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${unsubToken}`;
        const html = renderConfirmHtml(confirmUrl, unsubUrl);

        const resend = getResend();
        const { error } = await resend.emails.send({
            from: FROM,
            to: email,
            subject: 'Confirme ton inscription à Ancre-toi',
            html,
            headers: { 'List-Unsubscribe': `<${unsubUrl}>` },
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ ok: false, error: 'email_send_failed' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('newsletter/subscribe error:', err);
        return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
    }
}

function renderConfirmHtml(confirmUrl: string, unsubUrl: string) {
    return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6">
    <h2 style="margin:0 0 12px">Bienvenue ✨</h2>
    <p style="margin:0 0 12px">
      Confirme ton inscription à l’inspiration <strong>Ancre-toi</strong> :
    </p>
    <p style="margin:0 0 16px">
      <a href="${confirmUrl}" style="display:inline-block;background:#6d5ba4;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">
        Confirmer mon email
      </a>
    </p>
    <p style="color:#666;font-size:12px;margin:0 0 8px">
      Si tu n’es pas à l’origine de cette demande, ignore ce message.
    </p>
    <p style="color:#666;font-size:12px;margin:0">
      Tu ne veux plus recevoir ces emails ?
      <a href="${unsubUrl}" style="color:#6d5ba4">Se désinscrire</a>.
    </p>
  </div>`;
}
