// src/app/settings/components/TwoFactorClient.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function TwoFactorClient() {
    const [enabled, setEnabled] = useState(false);
    const [busy, setBusy] = useState(false);
    const [qr, setQr] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [code, setCode] = useState('');

    async function startSetup() {
        setBusy(true);
        try {
            const r = await fetch('/api/settings/2fa/start');
            const j = await r.json();
            setQr(j.qrDataUrl || null);
            setSecret(j.secret || null);
        } finally {
            setBusy(false);
        }
    }

    async function confirm() {
        setBusy(true);
        try {
            const r = await fetch('/api/settings/2fa/confirm', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            if (r.ok) setEnabled(true);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="text-sm">
            {!enabled ? (
                <div className="space-y-2">
                    <p className="text-muted-foreground">Protège ton compte avec un code à usage unique (Google Authenticator, 1Password, etc.).</p>
                    {!qr ? (
                        <button onClick={startSetup} disabled={busy} className="rounded-lg px-3 py-1.5 ring-1 ring-border hover:bg-muted">
                            {busy ? 'Préparation…' : 'Activer la 2FA'}
                        </button>
                    ) : (
                        <div className="space-y-2">
                            {qr && (
                                <div className="h-36 w-36 overflow-hidden rounded border relative">
                                    {/* data URL; disable optimization */}
                                    <Image src={qr} alt="QR TOTP" fill unoptimized sizes="144px" />
                                </div>
                            )}
                            {secret && (
                                <div className="text-xs text-muted-foreground">
                                    Secret : <code>{secret}</code>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-40 rounded border px-2 py-1"
                                    placeholder="Code à 6 chiffres"
                                    inputMode="numeric"
                                    pattern="\d*"
                                />
                                <button onClick={confirm} disabled={busy || code.length !== 6} className="rounded-lg px-3 py-1.5 bg-brand-600 text-white disabled:opacity-60">
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <span>2FA activée ✅</span>
                    <button className="rounded-lg px-3 py-1.5 ring-1 ring-border hover:bg-muted">Désactiver</button>
                </div>
            )}
        </div>
    );
}
