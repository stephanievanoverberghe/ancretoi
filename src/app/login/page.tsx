'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const sp = useSearchParams();
    const next = sp.get('next') || '/app';

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setPending(true);
        const r = await fetch('/api/auth/login-password', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, password, next }),
        });
        setPending(false);
        if (r.ok) {
            const d = await r.json().catch(() => ({ redirectTo: '/app' }));
            location.href = d.redirectTo || '/app';
            return;
        }
        const d = await r.json().catch(() => ({}));
        setError(d?.error || 'Connexion impossible.');
    }

    return (
        <div className="mx-auto max-w-md">
            <h1 className="mb-2 font-serif text-3xl">Connexion</h1>
            <form onSubmit={submit} className="space-y-3">
                <input
                    className="w-full rounded-lg border border-input bg-card px-3 py-2"
                    type="email"
                    placeholder="email@domaine.fr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border border-input bg-card px-3 py-2"
                    type="password"
                    placeholder="Mot de passe"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50" disabled={pending || !email || !password}>
                    {pending ? 'Connexion…' : 'Se connecter'}
                </button>
            </form>
            <div className="mt-3 text-sm text-muted-foreground">
                Pas de compte ?{' '}
                <a className="underline" href="/register">
                    Créer un compte
                </a>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
                <a className="underline" href="/forgot-password">
                    Mot de passe oublié ?
                </a>
            </div>
        </div>
    );
}
