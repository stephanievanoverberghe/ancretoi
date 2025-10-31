// src/lib/consent.ts
export const CONSENT_COOKIE = 'at_consent';

export type Consent = {
    necessary: true;
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
};

export const DEFAULT_CONSENT: Consent = {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
};

// -- helpers pack/unpack pour payload tiny
function pack(c: Consent) {
    // p/a/m => 0|1 ; v=1 pour versionner le format
    return encodeURIComponent(JSON.stringify({ p: +c.preferences, a: +c.analytics, m: +c.marketing, v: 1 }));
}
function unpack(raw: string | undefined | null): Consent | null {
    if (!raw) return null;
    try {
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

// ---- CLIENT ONLY ----
export function readConsentCookieClient(): Consent | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
    if (!match) return null;
    return unpack(match.split('=')[1]);
}

export function writeConsentCookieClient(value: Consent, days = 365) {
    if (typeof document === 'undefined') return;

    // n’écrire que s’il y a un vrai changement
    const existing = readConsentCookieClient();
    if (existing && existing.preferences === value.preferences && existing.analytics === value.analytics && existing.marketing === value.marketing) {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    const payload = pack(value);

    // Path=/ + SameSite=Lax + Max-Age (plus robuste qu’Expires)
    document.cookie = `${CONSENT_COOKIE}=${payload}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}
