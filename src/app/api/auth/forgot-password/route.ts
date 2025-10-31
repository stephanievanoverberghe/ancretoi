// src/app/api/auth/forgot-password/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { dbConnect } from '@/db/connect';
import { UserModel, PasswordResetModel } from '@/db/schemas';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { sendPasswordResetEmail } from '@/lib/mailer'; // optionnel
const CSRF_COOKIE = 'csrf_token';

// anti-abus simple en mémoire (pour multi-instance -> Redis)
const ATTEMPTS = new Map<string, { count: number; until?: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function clientIp(req: NextRequest): string {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0]!.trim();
    const xrip = req.headers.get('x-real-ip');
    if (xrip) return xrip.trim();
    const cf = req.headers.get('cf-connecting-ip');
    if (cf) return cf.trim();
    return 'local';
}
function key(req: NextRequest) {
    return clientIp(req);
}
function rateLimit(req: NextRequest) {
    const k = key(req);
    const now = Date.now();
    const rec = ATTEMPTS.get(k) ?? { count: 0 };
    if (rec.until && now < rec.until) return { ok: false, retryAfter: Math.ceil((rec.until - now) / 1000) };
    return { ok: true };
}
function fail(req: NextRequest) {
    const k = key(req);
    const now = Date.now();
    const rec = ATTEMPTS.get(k) ?? { count: 0 };
    rec.count += 1;
    if (rec.count >= MAX_ATTEMPTS) {
        rec.until = now + WINDOW_MS;
        rec.count = 0;
    }
    ATTEMPTS.set(k, rec);
}
function success(req: NextRequest) {
    ATTEMPTS.delete(key(req));
}

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

type PickUserId = { _id: Types.ObjectId };
type Body = { email?: string };

export async function POST(req: NextRequest) {
    // rate-limit d'abord
    const rl = rateLimit(req);
    if (!rl.ok) {
        return NextResponse.json(
            { ok: true }, // pas de fuite d’info
            { status: 200, headers: { 'Retry-After': String(rl.retryAfter) } }
        );
    }

    // CSRF double-submit
    const csrfHeader = req.headers.get('x-csrf-token') || '';
    const csrfCookie = req.cookies.get(CSRF_COOKIE)?.value || '';
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        fail(req);
        return NextResponse.json({ ok: true }, { status: 200 }); // Toujours 200
    }

    let body: Body | null = null;
    try {
        body = (await req.json()) as Body;
    } catch {
        /* noop */
    }

    const normalized = String(body?.email || '')
        .toLowerCase()
        .trim();
    if (!normalized) return NextResponse.json({ ok: true });

    await dbConnect();
    const user = await UserModel.findOne({ email: normalized, deletedAt: null }).select('_id').lean<PickUserId>().exec();

    // Toujours 200, qu'il existe ou pas
    if (!user?._id) {
        success(req);
        return NextResponse.json({ ok: true });
    }

    // On invalide les anciens tokens de ce user (optionnel mais propre)
    await PasswordResetModel.deleteMany({ userId: user._id });

    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await PasswordResetModel.create({ userId: user._id, tokenHash, expiresAt });

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${raw}`;

    // Email réel à activer quand tu veux :
    try {
        await sendPasswordResetEmail(normalized, resetUrl);
    } catch {
        /* ignorer en dev */
    }

    success(req);

    const isProd = process.env.NODE_ENV === 'production';
    return NextResponse.json({ ok: true, ...(isProd ? {} : { devResetUrl: resetUrl }) });
}
