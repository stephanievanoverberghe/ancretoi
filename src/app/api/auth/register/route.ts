import { NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { issueMagicLink } from '@/lib/auth';

export async function POST(req: Request) {
    const { email, name, next } = await req.json().catch(() => ({}));
    if (!email) return NextResponse.json({ error: 'email requis' }, { status: 400 });

    await dbConnect();
    await UserModel.updateOne({ email: String(email).toLowerCase() }, { $setOnInsert: { email: String(email).toLowerCase(), name: name?.trim() || null } }, { upsert: true });

    await issueMagicLink(email, next || '/app');
    return NextResponse.json({ ok: true });
}
