// src/app/register/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, User, Lock, Loader2, Eye, EyeOff, Wand2, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { assessPassword, generateStrongPassword } from '@/lib/password';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [csrf, setCsrf] = useState<string>('');
    const [showPwd, setShowPwd] = useState(false);
    const [capsOn, setCapsOn] = useState(false);

    const sp = useSearchParams();
    const rawNext = sp.get('next') || '/member';
    const next = useMemo(() => (rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/member'), [rawNext]);

    useEffect(() => {
        fetch('/api/auth/csrf', { method: 'GET', credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setCsrf(String(d?.token || '')))
            .catch(() => setCsrf(''));
    }, []);

    // Strength + issues live
    const assessment = useMemo(() => assessPassword(password, email, name), [password, email, name]);
    const match = confirm.length > 0 && confirm === password;

    const strengthLabel = ['Très faible', 'Faible', 'Moyenne', 'Bonne', 'Excellente'][assessment.score]!;
    const strengthPct = [8, 25, 50, 75, 100][assessment.score]!;
    const strengthBarClass =
        assessment.score >= 4
            ? 'bg-emerald-600'
            : assessment.score === 3
            ? 'bg-lime-600'
            : assessment.score === 2
            ? 'bg-amber-600'
            : assessment.score === 1
            ? 'bg-orange-600'
            : 'bg-red-600';

    function onPwdKey(e: React.KeyboardEvent<HTMLInputElement>) {
        setCapsOn(e.getModifierState && e.getModifierState('CapsLock'));
    }

    function fillStrong() {
        const p = generateStrongPassword(16);
        setPassword(p);
        setConfirm(p);
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!csrf) {
            setError('Sécurité : jeton CSRF manquant. Rafraîchis la page et réessaie.');
            return;
        }
        if (!match) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        setPending(true);
        try {
            const r = await fetch('/api/auth/register-password', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
                body: JSON.stringify({ email, name, password, next }),
                credentials: 'same-origin',
            });
            if (r.ok) {
                const d = await r.json().catch(() => ({ redirectTo: '/member' }));
                location.href = d.redirectTo || '/member';
                return;
            }
            const d = await r.json().catch(() => ({}));
            setError(d?.error || 'Impossible de créer le compte.');
        } catch {
            setError('Erreur réseau. Réessaie.');
        } finally {
            setPending(false);
        }
    }

    const canSubmit =
        !!email &&
        password.length >= 12 &&
        assessment.score >= 3 && // on pousse à "bonne"
        match &&
        !pending;

    return (
        <div className="min-h-[70dvh] px-4 py-12 sm:py-20 bg-gradient-to-b from-brand-50/60 to-transparent">
            <div className="mx-auto max-w-md">
                {/* En-tête */}
                <div className="text-center mb-6">
                    <h1 className="font-serif text-3xl tracking-tight">Créer un compte</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Un mot de passe <span className="font-medium">solide</span> protège ton espace.
                    </p>
                </div>

                {/* Carte */}
                <div className="rounded-2xl border border-brand-200/70 bg-white/80 ring-1 ring-black/5 shadow-xl backdrop-blur">
                    <div className="border-b border-brand-100/60 bg-gradient-to-r from-brand-600/10 to-amber-400/10 rounded-t-2xl p-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-brand-700" />
                            <p className="text-sm text-muted-foreground">Inscription sécurisée (CSRF + cookie HttpOnly)</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-5 space-y-4">
                        {/* Nom (optionnel) */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1">
                                Prénom (optionnel)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                </span>
                                <input
                                    id="name"
                                    className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                                    type="text"
                                    placeholder="Ex. Stéph"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">
                                Adresse e-mail
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                </span>
                                <input
                                    id="email"
                                    className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                                    type="email"
                                    placeholder="email@domaine.fr"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password + générateur */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium mb-1">
                                    Mot de passe
                                </label>
                                <button
                                    type="button"
                                    onClick={fillStrong}
                                    className="inline-flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 ring-1 ring-brand-200 hover:bg-brand-50"
                                >
                                    <Wand2 className="h-3.5 w-3.5" /> Générer fort
                                </button>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">
                                    <Lock className="h-4 w-4" />
                                </span>
                                <input
                                    id="password"
                                    className="w-full rounded-xl border border-input bg-card pl-9 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="Au moins 12 caractères, avec Aa 0 !"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyUp={onPwdKey}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    className="absolute right-2 top-1.5 rounded-lg p-1 text-muted-foreground hover:bg-muted"
                                    aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                >
                                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Caps lock + force */}
                            {capsOn && <p className="mt-1 text-xs text-amber-700">⚠️ Verr. Maj activé</p>}
                            <div className="mt-2">
                                <div className="h-2 w-full rounded-full bg-gray-200">
                                    <div className={`h-2 rounded-full ${strengthBarClass}`} style={{ width: `${strengthPct}%` }} />
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
                                Confirmer le mot de passe
                            </label>
                            <input
                                id="confirm"
                                className="w-full rounded-xl border border-input bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                                type="password"
                                placeholder="Retape ton mot de passe"
                                required
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                autoComplete="new-password"
                            />
                            {confirm.length > 0 && !match && <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas.</p>}
                        </div>

                        {/* Erreur générale */}
                        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                        {/* CTA */}
                        <button
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-brand-700 disabled:opacity-60"
                            disabled={!canSubmit}
                            type="submit"
                        >
                            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {pending ? 'Création…' : 'Créer mon compte'}
                        </button>

                        <div className="mt-2 text-sm text-muted-foreground text-center">
                            Déjà un compte ?{' '}
                            <a className="underline underline-offset-4 hover:text-brand-700" href="/login">
                                Se connecter
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
