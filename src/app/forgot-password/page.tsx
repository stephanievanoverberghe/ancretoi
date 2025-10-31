// src/app/forgot-password/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Mail, Loader2, ShieldCheck, Link as LinkIcon } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [csrf, setCsrf] = useState('');
    const [pending, setPending] = useState(false);
    const [sent, setSent] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/auth/csrf', { method: 'GET', credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => setCsrf(String(d?.token || '')))
            .catch(() => setCsrf(''));
    }, []);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSent(null);
        if (!csrf) {
            setError('Sécurité : jeton CSRF manquant.');
            return;
        }
        setPending(true);
        try {
            const r = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
                body: JSON.stringify({ email }),
                credentials: 'same-origin',
            });
            const d = await r.json().catch(() => ({}));
            if (r.ok) setSent(d.devResetUrl || 'ok');
            else setSent('ok'); // on ne divulgue rien
        } catch {
            setError('Erreur réseau. Réessaie.');
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="min-h-[60dvh] px-4 py-12 sm:py-20">
            <div className="mx-auto max-w-md rounded-2xl border border-brand-200/70 bg-white/80 ring-1 ring-black/5 shadow-xl backdrop-blur">
                <div className="border-b border-brand-100/60 bg-gradient-to-r from-brand-600/10 to-amber-400/10 rounded-t-2xl p-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-brand-700" />
                        <p className="text-sm text-muted-foreground">Lien de réinitialisation sécurisé</p>
                    </div>
                </div>

                <form onSubmit={submit} className="p-5 space-y-4">
                    <div className="text-center">
                        <h1 className="font-serif text-2xl">Mot de passe oublié</h1>
                        <p className="text-sm text-muted-foreground mt-1">Si un compte existe, tu recevras un e-mail avec un lien valable 15&nbsp;minutes.</p>
                    </div>

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
                                type="email"
                                required
                                className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                                placeholder="email@domaine.fr"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                    <button
                        type="submit"
                        disabled={pending || !email}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-brand-700 disabled:opacity-60"
                    >
                        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {pending ? 'Envoi…' : 'Envoyer le lien'}
                    </button>

                    {sent && (
                        <div className="mt-2 rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2 text-sm text-brand-900">
                            Lien envoyé si le compte existe. Pense à vérifier tes spams.
                            {sent !== 'ok' && (
                                <div className="mt-1 flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4" />
                                    <a className="underline break-all" href={sent}>
                                        {sent}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
