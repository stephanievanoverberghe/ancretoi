import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import Newsletter, { type NewsletterDoc } from '@/models/Newsletter';

type NewsletterStatus = NonNullable<NewsletterDoc['status']>;

export async function POST(req: Request) {
    await requireAdmin();
    await dbConnect();

    const form = await req.formData();
    const email = String(form.get('email') ?? '')
        .trim()
        .toLowerCase();
    const status = String(form.get('status') ?? '') as NewsletterStatus;

    const allowed: NewsletterStatus[] = ['confirmed', 'unsubscribed', 'pending', 'bounced', 'complained'];
    if (!email || !allowed.includes(status)) {
        return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
    }

    const doc = await Newsletter.findOne({ email }).exec();
    if (!doc) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

    doc.status = status;
    if (status === 'confirmed' && !doc.confirmedAt) doc.confirmedAt = new Date();
    if (status === 'unsubscribed') doc.unsubscribedAt = new Date();
    await doc.save();

    return NextResponse.redirect('/admin/newsletter', { status: 303 });
}
