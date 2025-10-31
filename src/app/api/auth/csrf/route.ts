// src/app/api/auth/csrf/route.ts
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const CSRF_COOKIE = 'csrf_token';

export async function GET() {
    const token = randomBytes(32).toString('base64url');

    const res = NextResponse.json({ token });
    // Double-submit cookie (même valeur côté cookie et côté requête)
    res.cookies.set(CSRF_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 30, // 30 min
    });
    return res;
}
