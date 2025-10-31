// src/app/api/auth/register-password/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { createSessionToken, setSessionCookie } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { isPasswordAcceptable } from '@/lib/password';

const CSRF_COOKIE = 'csrf_token';

// Anti-bruteforce simple (mémoire). Pour la prod multi-instance → Redis.
const ATTEMPTS = new Map<string, { count: number; until?: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 7;

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

function sanitizeNext(n: unknown): string {
    const raw = String(n || '');
    if (!raw.startsWith('/')) return '/member';
    if (raw.startsWith('//')) return '/member';
    if (raw.includes('://')) return '/member';
    return raw;
}

type RegisterBody = { email?: string; name?: string; password?: string; next?: unknown };

export async function POST(req: NextRequest) {
    const rl = rateLimit(req);
    if (!rl.ok) {
        return NextResponse.json(
            { error: 'Trop de tentatives. Réessaie plus tard.', code: 'RATE_LIMITED', retryAfter: rl.retryAfter },
            { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
        );
    }

    // CSRF
    const csrfHeader = req.headers.get('x-csrf-token') || '';
    const csrfCookie = req.cookies.get(CSRF_COOKIE)?.value || '';
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        fail(req);
        return NextResponse.json({ error: 'CSRF invalide' }, { status: 403 });
    }

    let body: RegisterBody | null = null;
    try {
        body = (await req.json()) as RegisterBody;
    } catch {
        fail(req);
        return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const email = String(body?.email || '')
        .toLowerCase()
        .trim();
    const name = String(body?.name || '').trim() || null;
    const password = String(body?.password || '');
    const next = sanitizeNext(body?.next);

    if (!email || !password) {
        fail(req);
        return NextResponse.json({ error: 'email et mot de passe requis' }, { status: 400 });
    }

    // Validation serveur "béton"
    const pwCheck = isPasswordAcceptable(password, email, name || undefined);
    if (!pwCheck.ok) {
        fail(req);
        return NextResponse.json(
            {
                error: 'Mot de passe trop faible. Exige au minimum 12 caractères, avec minuscules, MAJUSCULES, chiffres et symboles, sans suites ni répétitions, ni votre nom/email.',
                issues: pwCheck.issues,
                code: 'WEAK_PASSWORD',
            },
            { status: 400 }
        );
    }

    await dbConnect();

    const existing = await UserModel.findOne({ email }).select({ _id: 1, passwordHash: 1 }).lean<{ _id: string; passwordHash?: string | null }>();

    if (existing?.passwordHash) {
        fail(req);
        return NextResponse.json({ error: 'Cet e-mail est déjà associé à un compte.', code: 'EMAIL_IN_USE' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (existing) {
        await UserModel.updateOne({ _id: existing._id }, { $set: { name, passwordHash } });
    } else {
        await UserModel.create({ email, name, passwordHash, role: 'user' });
    }

    success(req);

    const jwt = await createSessionToken(email);
    const res = NextResponse.json({ ok: true, redirectTo: next });
    setSessionCookie(res, jwt);
    // Optionnel : on purge le CSRF après succès
    res.cookies.set(CSRF_COOKIE, '', { path: '/', maxAge: 0, sameSite: 'lax' });
    return res;
}
