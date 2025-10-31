// src/app/reset-password/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { assessPassword } from '@/lib/password';
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function ResetPasswordPage() {
    const sp = useSearchParams();
    const token = sp.get('token') || '';

    const [csrf, setCsrf] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [okToken, setOkToken] = useState<boolean | null>(null);
    const [done, setDone] = useState(false);

    const assessment = useMemo(() => assessPassword(password), [password]);
    const match = confirm.length > 0 && confirm === password;

    const strengthLabel = ['Très faible', 'Faible', 'Moyenne', 'Bonne', 'Excellente'][assessment.score]!;
    const strengthPct = [8, 25, 50, 75, 100][assessment.score]!;
    const bar =
        assessment.score >= 4
            ? 'bg-emerald-600'
            : assessment.score === 3
            ? 'bg-lime-600'
            : assessment.score === 2
            ? 'bg-amber-600'
            : assessment.score === 1
            ? 'bg-orange-600'
            : 'bg-red-600';

    useEffect(() => {
        if (!token) {
            setOkToken(false);
            return;
        }
        fetch(`/api/auth/reset-password/verify?token=${encodeURIComponent(token)}`, { credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setOkToken(!!d?.ok))
            .catch(() => setOkToken(false));
    }, [token]);

    useEffect(() => {
        fetch('/api/auth/csrf', { method: 'GET', credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setCsrf(String(d?.token || '')))
            .catch(() => setCsrf(''));
    }, []);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!csrf) {
            setError('Sécurité : jeton CSRF manquant.');
            return;
        }
        if (!match) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        setPending(true);
        try {
            const r = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
                body: JSON.stringify({ token, password }),
                credentials: 'same-origin',
            });
            const d = await r.json().catch(() => ({}));
            if (r.ok) setDone(true);
            else setError(d?.error || 'Impossible de réinitialiser.');
        } catch {
            setError('Erreur réseau. Réessaie.');
        } finally {
            setPending(false);
        }
    }

    if (okToken === false) {
        return (
            <div className="min-h-[60dvh] flex items-center justify-center px-4">
                <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-5">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        <p className="font-medium">Lien invalide ou expiré.</p>
                    </div>
                    <p className="text-sm mt-2">
                        Merci de refaire une demande depuis la page{' '}
                        <a className="underline" href="/forgot-password">
                            Mot de passe oublié
                        </a>
                        .
                    </p>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="min-h-[60dvh] flex items-center justify-center px-4">
                <div className="max-w-md w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5">
                    <p className="text-emerald-800">
                        ✅ Mot de passe changé. Tu peux maintenant{' '}
                        <a className="underline" href="/login">
                            te connecter
                        </a>
                        .
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60dvh] px-4 py-12 sm:py-20">
            <div className="mx-auto max-w-md rounded-2xl border border-brand-200/70 bg-white/80 ring-1 ring-black/5 shadow-xl backdrop-blur">
                <div className="border-b border-brand-100/60 bg-gradient-to-r from-brand-600/10 to-amber-400/10 rounded-t-2xl p-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-brand-700" />
                        <p className="text-sm text-muted-foreground">Réinitialisation sécurisée</p>
                    </div>
                </div>

                <form onSubmit={submit} className="p-5 space-y-4">
                    <h1 className="font-serif text-2xl text-center">Nouveau mot de passe</h1>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-1">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">
                                <Lock className="h-4 w-4" />
                            </span>
                            <input
                                id="password"
                                type={showPwd ? 'text' : 'password'}
                                required
                                className="w-full rounded-xl border border-input bg-card pl-9 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                                placeholder="≥ 12 caractères avec Aa 0 !"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1.5 rounded-lg p-1 text-muted-foreground hover:bg-muted">
                                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Force */}
                        <div className="mt-2">
                            <div className="h-2 w-full rounded-full bg-gray-200">
                                <div className={`h-2 rounded-full ${bar}`} style={{ width: `${strengthPct}%` }} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Force : {strengthLabel}</p>
                        </div>

                        {/* Checklist */}
                        <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
                            {[
                                { ok: password.length >= 12, label: '≥ 12 caractères' },
                                { ok: /[a-z]/.test(password), label: '1 minuscule' },
                                { ok: /[A-Z]/.test(password), label: '1 MAJUSCULE' },
                                { ok: /[0-9]/.test(password), label: '1 chiffre' },
                                { ok: /[^\w\s]/.test(password), label: '1 symbole' },
                                { ok: !/(.)\1{2,}/.test(password), label: 'pas de répétitions' },
                            ].map((it) => (
                                <li key={it.label} className="flex items-center gap-1.5">
                                    {it.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-gray-400" />}
                                    <span className={it.ok ? 'text-emerald-700' : 'text-muted-foreground'}>{it.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Confirm */}
                    <div>
                        <label htmlFor="confirm" className="block text-sm font-medium mb-1">
                            Confirmer
                        </label>
                        <input
                            id="confirm"
                            type="password"
                            required
                            className="w-full rounded-xl border border-input bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                            placeholder="Retape le mot de passe"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                        />
                        {confirm.length > 0 && !match && <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas.</p>}
                    </div>

                    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                    <button
                        type="submit"
                        disabled={pending || !match || password.length < 12 || assessment.score < 3}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-brand-700 disabled:opacity-60"
                    >
                        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {pending ? 'Mise à jour…' : 'Mettre à jour'}
                    </button>
                </form>
            </div>
        </div>
    );
}
