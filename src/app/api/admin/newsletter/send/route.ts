import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import Newsletter, { type NewsletterDoc } from '@/models/Newsletter';
import crypto from 'node:crypto';
import type { FilterQuery } from 'mongoose';

const resend = new Resend(process.env.RESEND_API_KEY ?? '');
const FROM = process.env.RESEND_FROM ?? '';
const APP_URL = process.env.APP_URL ?? '';

export const runtime = 'nodejs';

function renderCampaignHtml(innerHtml: string, unsubUrl: string) {
    return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6">
    ${innerHtml}
    <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
    <p style="color:#666;font-size:12px">
      Tu ne veux plus recevoir ces emails ?
      <a href="${unsubUrl}" style="color:#6d5ba4">Se désinscrire</a>.
    </p>
  </div>`;
}

export async function POST(req: Request) {
    await requireAdmin();
    if (!process.env.RESEND_API_KEY || !FROM || !APP_URL) {
        return NextResponse.json({ ok: false, error: 'missing_env' }, { status: 500 });
    }

    await dbConnect();

    const form = await req.formData();
    const subject = String(form.get('subject') ?? '').trim();
    const html = String(form.get('html') ?? '').trim();
    const testEmail = String(form.get('testEmail') ?? '')
        .trim()
        .toLowerCase();
    const tag = String(form.get('tag') ?? '').trim();

    if (!subject || !html) {
        return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
    }

    // Envoi test ?
    if (testEmail) {
        const testToken = crypto.randomBytes(24).toString('hex');
        const unsubUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${testToken}`;
        const wrapped = renderCampaignHtml(html, unsubUrl);

        const { error } = await resend.emails.send({
            from: FROM,
            to: testEmail,
            subject,
            html: wrapped,
            headers: { 'List-Unsubscribe': `<${unsubUrl}>` },
        });
        if (error) return NextResponse.json({ ok: false, error: 'send_failed' }, { status: 500 });

        return NextResponse.redirect('/admin/newsletter', { status: 303 });
    }

    // Envoi global (confirmés, optionnellement filtrés par tag)
    const filter: FilterQuery<NewsletterDoc> = { status: 'confirmed' };
    if (tag) filter.tags = tag;

    const recipients = await Newsletter.find(filter).select('email unsubToken').lean().exec();

    for (const r of recipients) {
        const token = r.unsubToken ?? crypto.randomBytes(24).toString('hex'); // fallback si absent
        const unsubUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${token}`;
        const wrapped = renderCampaignHtml(html, unsubUrl);

        const { error } = await resend.emails.send({
            from: FROM,
            to: r.email,
            subject,
            html: wrapped,
            headers: { 'List-Unsubscribe': `<${unsubUrl}>` },
        });

        // On ignore les erreurs individuelles; pour du volume, log/flag en "bounced"
        if (error) continue;
    }

    return NextResponse.redirect('/admin/newsletter', { status: 303 });
}
