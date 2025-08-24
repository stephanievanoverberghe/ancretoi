import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { dbConnect } from '@/db/connect';
import Newsletter, { type NewsletterDoc } from '@/models/Newsletter';
import type { FilterQuery } from 'mongoose';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim();
    const status = (searchParams.get('status') ?? 'all') as 'all' | NonNullable<NewsletterDoc['status']>;

    const filter: FilterQuery<NewsletterDoc> = {};
    if (q) filter.email = { $regex: q, $options: 'i' };
    if (status !== 'all') filter.status = status;

    const rows = await Newsletter.find(filter).sort({ createdAt: -1 }).lean().exec();

    const header = ['email', 'status', 'tags', 'source', 'consentAt', 'confirmedAt', 'unsubscribedAt', 'createdAt', 'updatedAt'];

    const csv = [
        header.join(','),
        ...rows.map((r) =>
            [
                r.email,
                r.status ?? '',
                Array.isArray(r.tags) ? JSON.stringify(r.tags) : '',
                r.source ?? '',
                r.consentAt ? new Date(r.consentAt).toISOString() : '',
                r.confirmedAt ? new Date(r.confirmedAt).toISOString() : '',
                r.unsubscribedAt ? new Date(r.unsubscribedAt).toISOString() : '',
                r.createdAt ? new Date(r.createdAt).toISOString() : '',
                r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
            ]
                .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                .join(',')
        ),
    ].join('\n');

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="newsletter_export.csv"',
        },
    });
}
