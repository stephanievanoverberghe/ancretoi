'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginForm({ next }: { next: string }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setPending(true);
        try {
            const r = await fetch('/api/auth/login-password', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email, password, next }),
            });
            setPending(false);
            if (r.ok) {
                const d = await r.json().catch(() => ({ redirectTo: '/member' }));
                window.location.href = d.redirectTo || '/member';
                return;
            }
            const d = await r.json().catch(() => ({}));
            setError((d as { error?: string })?.error || 'Connexion impossible.');
        } catch {
            setPending(false);
            setError('Réseau indisponible. Réessaie dans un instant.');
        }
    }

    return (
        <>
            <form onSubmit={submit} className="space-y-3">
                <input type="hidden" name="next" value={next} />

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
                <Link className="underline" href={`/register?next=${encodeURIComponent(next)}`}>
                    Créer un compte
                </Link>
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
                <Link className="underline" href={`/forgot-password?next=${encodeURIComponent(next)}`}>
                    Mot de passe oublié ?
                </Link>
            </div>
        </>
    );
}
