// src/app/login/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [csrf, setCsrf] = useState<string>('');
    const [showPwd, setShowPwd] = useState(false);

    const sp = useSearchParams();
    const rawNext = sp.get('next') || '/member';
    const next = useMemo(() => (rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/member'), [rawNext]);

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
            setError('Sécurité : jeton CSRF manquant. Rafraîchis la page et réessaie.');
            return;
        }
        setPending(true);
        try {
            const r = await fetch('/api/auth/login-password', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-csrf-token': csrf,
                },
                body: JSON.stringify({ email, password, next }),
                credentials: 'same-origin',
            });

            if (r.ok) {
                const d = await r.json().catch(() => ({ redirectTo: '/member' }));
                location.href = d.redirectTo || '/member';
                return;
            }
            const d = await r.json().catch(() => ({}));
            if (r.status === 429 && d?.retryAfter) {
                setError(`Trop de tentatives. Réessaie dans ${d.retryAfter}s.`);
            } else {
                setError(d?.error || 'Connexion impossible.');
            }
        } catch {
            setError('Erreur réseau. Réessaie.');
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="min-h-[70dvh] px-4 py-12 sm:py-20 bg-gradient-to-b from-brand-50/60 to-transparent">
            <div className="mx-auto max-w-md">
                {/* En-tête */}
                <div className="text-center mb-6">
                    <h1 className="font-serif text-3xl tracking-tight">Bon retour ✨</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Connecte-toi pour accéder à <span className="font-medium">ton espace membre</span>.
                    </p>
                </div>

                {/* Carte */}
                <div className="rounded-2xl border border-brand-200/70 bg-white/80 ring-1 ring-black/5 shadow-xl backdrop-blur">
                    <div className="border-b border-brand-100/60 bg-gradient-to-r from-brand-600/10 to-amber-400/10 rounded-t-2xl p-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-brand-700" />
                            <p className="text-sm text-muted-foreground">Connexion sécurisée (CSRF + cookie HttpOnly)</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-5 space-y-4">
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
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Mot de passe */}
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
                                    className="w-full rounded-xl border border-input bg-card pl-9 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                        </div>

                        {/* Erreur */}
                        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                        {/* Bouton */}
                        <button
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-brand-700 disabled:opacity-60"
                            disabled={pending || !email || !password}
                            type="submit"
                        >
                            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {pending ? 'Connexion…' : 'Se connecter'}
                        </button>

                        {/* Liens d’aide */}
                        <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                            <a className="underline underline-offset-4 hover:text-brand-700" href="/forgot-password">
                                Mot de passe oublié ?
                            </a>
                            <a className="underline underline-offset-4 hover:text-brand-700" href="/register">
                                Créer un compte
                            </a>
                        </div>
                    </form>
                </div>

                {/* Note accessibilité */}
                <p className="mt-4 text-center text-xs text-muted-foreground">
                    Besoin d’aide ?{' '}
                    <a href="/help" className="underline underline-offset-4">
                        Centre d’aide
                    </a>
                </p>
            </div>
        </div>
    );
}
