'use client';

import { useEffect, useState } from 'react';

export default function EmailChangeClient({ current }: { current: string }) {
    const [csrf, setCsrf] = useState('');
    const [step, setStep] = useState<'edit' | 'verify' | 'done'>('edit');
    const [email, setEmail] = useState(current);
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/auth/csrf', { credentials: 'same-origin' })
            .then((r) => r.json())
            .then((d) => setCsrf(String(d?.token || '')))
            .catch(() => setCsrf(''));
    }, []);

    async function requestChange(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setMsg(null);
        if (!csrf) {
            setErr('CSRF manquant, recharge la page.');
            return;
        }
        setBusy(true);
        try {
            const r = await fetch('/api/settings/email/request', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
                body: JSON.stringify({ email }),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j?.ok) throw new Error(j?.error || 'Impossible d’envoyer le code');
            setStep('verify');
            setMsg('Code envoyé. Consulte ta boîte mail.');
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setBusy(false);
        }
    }

    async function confirmCode(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setMsg(null);
        if (!csrf) {
            setErr('CSRF manquant, recharge la page.');
            return;
        }
        setBusy(true);
        try {
            const r = await fetch('/api/settings/email/confirm', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
                body: JSON.stringify({ email, code }),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j?.ok) throw new Error(j?.error || 'Code invalide');
            setStep('done');
            setMsg('E-mail mis à jour ✅');
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setBusy(false);
        }
    }

    if (step === 'done') {
        return <p className="text-sm text-emerald-700">Ton adresse e-mail a été mise à jour.</p>;
    }

    return (
        <div className="space-y-3">
            {step === 'edit' && (
                <form onSubmit={requestChange} className="space-y-2">
                    <input
                        type="email"
                        required
                        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nouveau@domaine.fr"
                        autoComplete="email"
                    />
                    <div className="flex items-center gap-2">
                        <button disabled={busy || !email} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted">
                            {busy ? 'Envoi…' : 'Envoyer le code'}
                        </button>
                        {msg && <span className="text-xs text-emerald-700">{msg}</span>}
                        {err && <span className="text-xs text-brand-700">{err}</span>}
                    </div>
                </form>
            )}

            {step === 'verify' && (
                <form onSubmit={confirmCode} className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                        Entre le code reçu sur <span className="font-medium">{email}</span>.
                    </div>
                    <input
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={6}
                        className="w-40 rounded-lg border border-input bg-card px-3 py-2 text-sm tracking-widest"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    />
                    <div className="flex items-center gap-2">
                        <button disabled={busy || code.length !== 6} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
                            {busy ? 'Vérification…' : 'Confirmer'}
                        </button>
                        {msg && <span className="text-xs text-emerald-700">{msg}</span>}
                        {err && <span className="text-xs text-brand-700">{err}</span>}
                    </div>
                </form>
            )}
        </div>
    );
}
