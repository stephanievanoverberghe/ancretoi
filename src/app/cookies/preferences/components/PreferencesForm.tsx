// src/app/cookies/preferences/components/PreferencesForm.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Cookie as CookieIcon, Check, X } from 'lucide-react';
import { DEFAULT_CONSENT, type Consent } from '@/lib/consent';

export type ConsentCategories = {
    necessary: boolean;
    preferences: boolean;
    analytics: boolean;
    marketing: boolean;
};

type Props = {
    cookieName?: string; // now actually used
    cookieDays?: number;
    initial?: Partial<ConsentCategories>;
};

const FALLBACK: ConsentCategories = { ...DEFAULT_CONSENT };

type Option = {
    key: keyof ConsentCategories;
    label: string;
    description: string;
};

const OPTIONS: ReadonlyArray<Option> = [
    { key: 'necessary', label: 'Cookies nécessaires', description: 'Essentiels au bon fonctionnement du site (authentification, sécurité). Toujours actifs.' },
    { key: 'preferences', label: 'Cookies de préférences', description: 'Mémorisent vos choix (langue, affichage, consentements).' },
    { key: 'analytics', label: 'Mesure d’audience', description: 'Permettent de mesurer la fréquentation et l’utilisation du site.' },
    { key: 'marketing', label: 'Cookies marketing', description: 'Utilisés pour personnaliser le contenu et la publicité.' },
] as const;

/* --- local tiny (un)pack helpers aligned with your cookie format {p,a,m,v} --- */
function unpack(raw: string | null | undefined): Consent | null {
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
function pack(c: Consent) {
    return encodeURIComponent(JSON.stringify({ p: +c.preferences, a: +c.analytics, m: +c.marketing, v: 1 }));
}
function readCookieByName(name: string): Consent | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
    if (!match) return null;
    return unpack(match.split('=')[1]);
}
function writeCookieByName(name: string, value: Consent, days: number) {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    const payload = pack(value);
    document.cookie = `${name}=${payload}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

export default function PreferencesForm({ cookieName = 'at_consent', cookieDays = 365, initial = {} }: Props) {
    const fallback = useMemo<ConsentCategories>(() => ({ ...FALLBACK, ...initial, necessary: true }), [initial]);
    const [consent, setConsent] = useState<ConsentCategories>(fallback);
    const [saved, setSaved] = useState<'idle' | 'success'>('idle');

    // hydrate from the provided cookieName
    useEffect(() => {
        const fromCookie = readCookieByName(cookieName);
        if (fromCookie) setConsent({ ...fromCookie, necessary: true });
    }, [cookieName]);

    function acceptAll() {
        setConsent({ necessary: true, preferences: true, analytics: true, marketing: true });
        setSaved('idle');
    }
    function rejectAll() {
        setConsent({ necessary: true, preferences: false, analytics: false, marketing: false });
        setSaved('idle');
    }
    function save() {
        const val: Consent = {
            necessary: true,
            preferences: !!consent.preferences,
            analytics: !!consent.analytics,
            marketing: !!consent.marketing,
        };
        writeCookieByName(cookieName, val, cookieDays);
        setSaved('success');
        // optionnel: window.location.reload();
    }

    return (
        <>
            <div className="space-y-5">
                {OPTIONS.map((opt) => {
                    const isDisabled = opt.key === 'necessary';
                    return (
                        <div key={opt.key} className="flex items-start justify-between gap-4 border-b border-border/40 pb-4 last:border-none last:pb-0">
                            <div>
                                <h3 className="font-medium flex items-center gap-2">
                                    <CookieIcon className="h-4 w-4 text-brand-700" /> {opt.label}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
                            </div>

                            <div className="flex-shrink-0">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        disabled={isDisabled}
                                        checked={consent[opt.key]}
                                        onChange={(e) => {
                                            if (isDisabled) return;
                                            setConsent((c) => ({ ...c, [opt.key]: e.target.checked }));
                                            setSaved('idle');
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:bg-brand-600 transition-all" />
                                    <span className="ml-3 text-sm">
                                        {consent[opt.key] ? (
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Check className="h-3.5 w-3.5" /> Activé
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <X className="h-3.5 w-3.5" /> Inactif
                                            </span>
                                        )}
                                    </span>
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button type="button" className="btn-secondary text-sm" onClick={rejectAll}>
                    Refuser tout
                </button>
                <button type="button" className="btn text-sm" onClick={acceptAll}>
                    Tout accepter
                </button>
                <button type="button" className="btn text-sm" onClick={save}>
                    Enregistrer mes choix
                </button>
            </div>

            {saved === 'success' && <p className="mt-2 text-sm text-emerald-700">✅ Préférences enregistrées pour 12 mois.</p>}
        </>
    );
}
