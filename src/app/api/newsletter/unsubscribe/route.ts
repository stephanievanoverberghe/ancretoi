// src/app/api/newsletter/unsubscribe/route.ts
import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import Newsletter from '@/models/Newsletter';

export const runtime = 'nodejs';

const APP_URL = process.env.APP_URL ?? '';

export async function GET(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';

    const doc = await Newsletter.findOne({ unsubToken: token }).exec();
    if (!doc) {
        return NextResponse.redirect(`${APP_URL}/newsletter/error?code=invalid_unsub`);
    }

    doc.status = 'unsubscribed';
    doc.unsubscribedAt = new Date();
    await doc.save();

    return NextResponse.redirect(`${APP_URL}/newsletter/unsubscribed`);
}
