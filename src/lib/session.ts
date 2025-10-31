// src/lib/session.ts
import { SignJWT, jwtVerify } from 'jose';
import type { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev');

// En prod HTTPS, on utilise le préfixe __Host- (oblige Secure + Path=/ + pas de Domain)
export const sessionCookieName = process.env.NODE_ENV === 'production' ? '__Host-ancretoi_session' : 'ancretoi_session';

type SessionPayload = { email: string; iat?: number; exp?: number };

export async function createSessionToken(email: string) {
    return await new SignJWT({ email }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);
}

export function setSessionCookie(res: NextResponse, token: string) {
    // httpOnly + SameSite=Lax = protège contre XSS/CSRF pour la majorité des cas
    res.cookies.set(sessionCookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        // NE PAS mettre "domain" si __Host-*
    });
}

export function clearSessionCookie(res: NextResponse) {
    res.cookies.set(sessionCookieName, '', {
        path: '/',
        maxAge: 0,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    });
}

export async function getSession(): Promise<SessionPayload | null> {
    const store = await cookies();
    const c = store.get(sessionCookieName)?.value;
    if (!c) return null;
    try {
        const { payload } = await jwtVerify(c, secret);
        return payload as SessionPayload;
    } catch {
        return null;
    }
}

export async function readSessionFromRequest(req: NextRequest) {
    const c = req.cookies.get(sessionCookieName)?.value;
    if (!c) return null;
    try {
        const { payload } = await jwtVerify(c, secret);
        return payload as SessionPayload;
    } catch {
        return null;
    }
}
