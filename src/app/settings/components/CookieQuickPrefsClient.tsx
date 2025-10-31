// src/app/settings/components/CookieQuickPrefsClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { readConsentCookieClient, writeConsentCookieClient, DEFAULT_CONSENT, type Consent } from '@/lib/consent';

export default function CookieQuickPrefsClient() {
    const [consent, setConsent] = useState<Consent | null>(null);

    useEffect(() => {
        setConsent(readConsentCookieClient() ?? DEFAULT_CONSENT);
    }, []);

    if (!consent) return null;

    function set<K extends keyof Consent>(k: K, v: Consent[K]) {
        if (!consent) return; // type guard for TS
        // Make sure 'necessary' stays the literal true
        const next: Consent = { ...consent, [k]: v, necessary: true as const };
        setConsent(next);
        writeConsentCookieClient(next, 365);
    }

    return (
        <div className="grid gap-2">
            <label className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <span>Mesure d’audience</span>
                <input type="checkbox" checked={consent.analytics} onChange={(e) => set('analytics', e.target.checked)} />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <span>Cookies marketing</span>
                <input type="checkbox" checked={consent.marketing} onChange={(e) => set('marketing', e.target.checked)} />
            </label>
        </div>
    );
}
