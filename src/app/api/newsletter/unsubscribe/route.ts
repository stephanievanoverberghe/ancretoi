import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import Newsletter from '@/models/Newsletter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';
    const origin = process.env.APP_URL ?? new URL(req.url).origin;

    const doc = await Newsletter.findOne({ unsubToken: token }).exec();
    if (!doc) {
        return NextResponse.redirect(`${origin}/newsletter/error?code=invalid_unsub`);
    }

    doc.status = 'unsubscribed';
    doc.unsubscribedAt = new Date();
    await doc.save();

    return NextResponse.redirect(`${origin}/newsletter/unsubscribed`);
}
