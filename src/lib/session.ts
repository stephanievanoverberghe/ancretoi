import { SignJWT, jwtVerify } from 'jose';
import type { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev');
export const sessionCookieName = 'ancretoi_session';

/** Génère le JWT */
export async function createSessionToken(email: string) {
    return await new SignJWT({ email }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);
}

/** Pose le cookie sur la réponse */
export function setSessionCookie(res: NextResponse, token: string) {
    res.cookies.set(sessionCookieName, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    });
}

/** Efface le cookie */
export function clearSessionCookie(res: NextResponse) {
    res.cookies.set(sessionCookieName, '', { path: '/', maxAge: 0 });
}

/** Lit la session côté serveur */
export async function getSession() {
    const store = await cookies(); // Next 15: async
    const c = store.get(sessionCookieName)?.value;
    if (!c) return null;
    try {
        const { payload } = await jwtVerify(c, secret);
        return payload as { email: string; exp?: number };
    } catch {
        return null;
    }
}

/** Lecture depuis NextRequest (si besoin) */
export async function readSessionFromRequest(req: NextRequest) {
    const c = req.cookies.get(sessionCookieName)?.value;
    if (!c) return null;
    try {
        const { payload } = await jwtVerify(c, secret);
        return payload as { email: string; exp?: number };
    } catch {
        return null;
    }
}
