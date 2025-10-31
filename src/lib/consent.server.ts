// src/lib/consent.server.ts
import 'server-only';
import { cookies } from 'next/headers';
import { CONSENT_COOKIE, type Consent } from './consent'; // <-- DEFAULT_CONSENT removed

export async function readConsentCookieServer(): Promise<Consent | null> {
    try {
        const jar = await cookies();
        const raw = jar.get(CONSENT_COOKIE)?.value;
        if (!raw) return null;

        // decode packed cookie {p,a,m,v}
        const j = JSON.parse(decodeURIComponent(raw));
        return {
            necessary: true,
            preferences: !!j.p,
            analytics: !!j.a,
            marketing: !!j.m,
        };
    } catch {
        return null;
    }
}
