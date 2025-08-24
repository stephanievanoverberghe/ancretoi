'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const sp = useSearchParams();
    const next = sp.get('next') || '/member';

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (password !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        setPending(true);
        const r = await fetch('/api/auth/register-password', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, name, password, next }),
        });
        setPending(false);
        if (r.ok) {
            const d = await r.json().catch(() => ({ redirectTo: '/member' }));
            location.href = d.redirectTo || '/member';
            return;
        }
        const d = await r.json().catch(() => ({}));
        setError(d?.error || 'Impossible de créer le compte.');
    }

    return (
        <div className="mx-auto max-w-md py-16 sm:py-20 lg:py-24">
            <h1 className="mb-2 font-serif text-3xl">Créer un compte</h1>
            <form onSubmit={submit} className="space-y-3">
                <input
                    className="w-full rounded-lg border border-input bg-card px-3 py-2"
                    type="text"
                    placeholder="Prénom (optionnel)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
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
                    placeholder="Mot de passe (min 8 caractères)"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border border-input bg-card px-3 py-2"
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                    className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
                    disabled={pending || !email || password.length < 8 || confirm.length < 8}
                >
                    {pending ? 'Création…' : 'Créer mon compte'}
                </button>
            </form>
            <p className="mt-3 text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <a className="underline" href="/login">
                    Se connecter
                </a>
            </p>
        </div>
    );
}
