// src/app/api/auth/login-password/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { dbConnect } from '@/db/connect';
import { UserModel } from '@/db/schemas';
import { createSessionToken, setSessionCookie } from '@/lib/session';
import bcrypt from 'bcryptjs';

const CSRF_COOKIE = 'csrf_token';

// Anti-bruteforce (simple en mémoire). Pour la prod multi-instance, utiliser Redis.
const ATTEMPTS = new Map<string, { count: number; until?: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 7;

function clientIp(req: NextRequest): string {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0]!.trim();
    const xrip = req.headers.get('x-real-ip');
    if (xrip) return xrip.trim();
    const cf = req.headers.get('cf-connecting-ip');
    if (cf) return cf.trim();
    // NextRequest n’a pas de .ip typée → fallback
    return 'local';
}

function clientKey(req: NextRequest) {
    return clientIp(req);
}

function rateLimit(req: NextRequest) {
    const key = clientKey(req);
    const now = Date.now();
    const rec = ATTEMPTS.get(key) ?? { count: 0 };
    if (rec.until && now < rec.until) {
        return { ok: false, retryAfter: Math.ceil((rec.until - now) / 1000) };
    }
    return { ok: true };
}

function recordFailure(req: NextRequest) {
    const key = clientKey(req);
    const now = Date.now();
    const rec = ATTEMPTS.get(key) ?? { count: 0 };
    rec.count += 1;
    if (rec.count >= MAX_ATTEMPTS) {
        rec.until = now + WINDOW_MS;
        rec.count = 0; // reset après lock
    }
    ATTEMPTS.set(key, rec);
}

function recordSuccess(req: NextRequest) {
    ATTEMPTS.delete(clientKey(req));
}

function sanitizeNext(n: unknown): string {
    const raw = String(n || '');
    if (!raw.startsWith('/')) return '/member';
    if (raw.startsWith('//')) return '/member';
    if (raw.includes('://')) return '/member';
    return raw;
}

type LoginBody = { email?: string; password?: string; next?: unknown };

export async function POST(req: NextRequest) {
    const rl = rateLimit(req);
    if (!rl.ok) {
        return NextResponse.json(
            { error: 'Trop de tentatives. Réessaie plus tard.', code: 'RATE_LIMITED', retryAfter: rl.retryAfter },
            { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
        );
    }

    // CSRF: double-submit cookie
    const csrfHeader = req.headers.get('x-csrf-token') || '';
    const csrfCookie = req.cookies.get(CSRF_COOKIE)?.value || '';
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        recordFailure(req);
        return NextResponse.json({ error: 'CSRF invalide' }, { status: 403 });
    }

    let body: LoginBody | null = null;
    try {
        body = (await req.json()) as LoginBody;
    } catch {
        recordFailure(req);
        return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const email = String(body?.email || '')
        .toLowerCase()
        .trim();
    const password = String(body?.password || '');
    const next = sanitizeNext(body?.next);

    if (!email || !password) {
        recordFailure(req);
        return NextResponse.json({ error: 'email et mot de passe requis' }, { status: 400 });
    }

    await dbConnect();
    const user = await UserModel.findOne({ email }).lean<{ email: string; passwordHash?: string | null }>();
    if (!user || !user.passwordHash) {
        // message générique (pas de fuite d’info)
        recordFailure(req);
        return NextResponse.json({ error: 'Identifiants invalides', code: 'BAD_CREDENTIALS' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
        recordFailure(req);
        return NextResponse.json({ error: 'Identifiants invalides', code: 'BAD_CREDENTIALS' }, { status: 401 });
    }

    // Succès: reset compteur
    recordSuccess(req);

    // JWT session
    const jwt = await createSessionToken(user.email);
    const res = NextResponse.json({ ok: true, redirectTo: next });
    setSessionCookie(res, jwt);

    // Efface le token CSRF (optionnel)
    res.cookies.set(CSRF_COOKIE, '', { path: '/', maxAge: 0, sameSite: 'lax' });

    return res;
}
