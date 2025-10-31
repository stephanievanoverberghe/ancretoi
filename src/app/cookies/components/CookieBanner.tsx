// src/app/cookies/components/CookieBanner.tsx

'use client';

import { useEffect, useState } from 'react';
import { Shield, Cookie as CookieIcon, MousePointerClick } from 'lucide-react';
import Link from 'next/link';
import { DEFAULT_CONSENT, readConsentCookieClient, writeConsentCookieClient, type Consent } from '@/lib/consent';

type Props = { days?: number };

export default function CookieBanner({ days = 365 }: Props) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const existing = readConsentCookieClient();
        setVisible(!existing);
    }, []);

    if (!visible) return null;

    function acceptAll() {
        const c: Consent = { necessary: true, preferences: true, analytics: true, marketing: true };
        writeConsentCookieClient(c, days);
        setVisible(false);
    }

    function rejectAll() {
        writeConsentCookieClient(DEFAULT_CONSENT, days);
        setVisible(false);
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
            <div className="mx-auto max-w-3xl rounded-2xl border border-brand-200/60 bg-white/90 backdrop-blur ring-1 ring-black/5 shadow-lg">
                <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 text-brand-700">
                            <CookieIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-semibold tracking-tight">Gestion des cookies</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Nous utilisons des cookies pour le bon fonctionnement du site et, avec votre accord, pour mesurer l’audience et personnaliser certains contenus.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button type="button" className="btn text-xs sm:text-sm" onClick={acceptAll}>
                                    Tout accepter
                                </button>
                                <button type="button" className="btn-secondary text-xs sm:text-sm" onClick={rejectAll}>
                                    Refuser tout
                                </button>
                                <Link
                                    href="/cookies/preferences"
                                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium ring-1 ring-brand-100 text-brand-700 hover:bg-brand-50"
                                    onClick={() => setVisible(false)}
                                >
                                    <MousePointerClick className="h-4 w-4" />
                                    Personnaliser
                                </Link>
                                <Link
                                    href="/privacy"
                                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium ring-1 ring-brand-100 text-brand-700 hover:bg-brand-50"
                                >
                                    <Shield className="h-4 w-4" />
                                    En savoir plus
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
