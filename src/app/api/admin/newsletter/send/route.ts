import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import Newsletter, { type NewsletterDoc } from '@/models/Newsletter';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

const FROM = process.env.RESEND_FROM ?? '';
const APP_URL = process.env.APP_URL ?? '';

function wantsJSON(req: Request) {
    const a = req.headers.get('accept') || '';
    const x = (req.headers.get('x-requested-with') || '').toLowerCase();
    return a.includes('application/json') || x === 'fetch' || x === 'xmlhttprequest';
}

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

    const apiKey = process.env.RESEND_API_KEY ?? '';
    if (!apiKey || !FROM || !APP_URL) {
        const err = { ok: false, error: 'missing_env' as const };
        return wantsJSON(req) ? NextResponse.json(err, { status: 500 }) : NextResponse.redirect('/admin/newsletter?err=missing_env', { status: 303 });
    }
    const resend = new Resend(apiKey);

    await dbConnect();

    const form = await req.formData();
    const subject = String(form.get('subject') ?? '').trim();
    const html = String(form.get('html') ?? '').trim();
    const testEmail = String(form.get('testEmail') ?? '')
        .trim()
        .toLowerCase();
    const tag = String(form.get('tag') ?? '').trim();

    if (!subject || !html) {
        const err = { ok: false, error: 'bad_request' as const };
        return wantsJSON(req) ? NextResponse.json(err, { status: 400 }) : NextResponse.redirect('/admin/newsletter?err=bad_request', { status: 303 });
    }

    // --- Envoi test
    if (testEmail) {
        const testToken = crypto.randomBytes(24).toString('hex'); // éphémère
        const unsubUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${testToken}`;
        const wrapped = renderCampaignHtml(html, unsubUrl);

        const { error } = await resend.emails.send({
            from: FROM,
            to: testEmail,
            subject,
            html: wrapped,
            headers: { 'List-Unsubscribe': `<${unsubUrl}>` },
        });

        const res = error ? { ok: false as const, error: 'send_failed' as const } : { ok: true as const, mode: 'test' as const };

        return wantsJSON(req)
            ? NextResponse.json(res, { status: error ? 500 : 200 })
            : NextResponse.redirect('/admin/newsletter' + (error ? '?err=send_failed' : '?ok=1'), { status: 303 });
    }

    // --- Envoi global (confirmés, option tag)
    const filter: Record<string, unknown> = { status: 'confirmed' as NewsletterDoc['status'] };
    if (tag) filter.tags = tag;

    type Recipient = Pick<NewsletterDoc, 'email' | 'unsubToken'> & { _id: unknown };
    const recipients = await Newsletter.find(filter).select({ _id: 1, email: 1, unsubToken: 1 }).lean<Recipient[]>().exec();

    // Assurer un unsubToken
    for (const r of recipients) {
        if (!r.unsubToken) {
            const token = crypto.randomBytes(24).toString('hex');
            await Newsletter.updateOne({ _id: r._id }, { $set: { unsubToken: token } }).exec();
            r.unsubToken = token;
        }
    }

    // Batching + stats
    let sent = 0;
    let failed = 0;
    const BATCH = 30;

    for (let i = 0; i < recipients.length; i += BATCH) {
        const slice = recipients.slice(i, i + BATCH);
        const results = await Promise.allSettled(
            slice.map(async (r) => {
                const unsubUrl = `${APP_URL}/api/newsletter/unsubscribe?token=${r.unsubToken}`;
                const wrapped = renderCampaignHtml(html, unsubUrl);
                await resend.emails.send({
                    from: FROM,
                    to: r.email,
                    subject,
                    html: wrapped,
                    headers: { 'List-Unsubscribe': `<${unsubUrl}>` },
                });
            })
        );
        for (const r of results) {
            if (r.status === 'fulfilled') {
                sent++;
            } else {
                failed++;
            }
        }
    }

    const payload = { ok: true as const, mode: 'bulk' as const, total: recipients.length, sent, failed, tag: tag || null };
    return wantsJSON(req) ? NextResponse.json(payload) : NextResponse.redirect(`/admin/newsletter?ok=1&sent=${sent}&failed=${failed}`, { status: 303 });
}
