'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export default function ResetPasswordClient() {
    const sp = useSearchParams();
    const router = useRouter();

    // lire le token depuis l’URL, mémoïsé
    const token = useMemo(() => sp.get('token') ?? '', [sp]);

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [ok, setOk] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Lien invalide ou manquant.');
            return;
        }
        if (password !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        const r = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });

        const d = await r.json().catch(() => ({}));
        if (r.ok) {
            setOk(true);
            setTimeout(() => router.push('/login?reset=ok'), 1200);
        } else {
            setError(d?.error || 'Lien invalide ou expiré.');
        }
    }

    if (!token) {
        return (
            <div className="mx-auto max-w-md p-6">
                <h1 className="mb-2 font-serif text-3xl">Lien invalide</h1>
                <p className="text-sm text-muted-foreground">
                    Redemande un lien depuis{' '}
                    <Link className="underline" href="/forgot-password">
                        “Mot de passe oublié”
                    </Link>
                    .
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-md p-6">
            <h1 className="mb-2 font-serif text-3xl">Nouveau mot de passe</h1>
            <form onSubmit={submit} className="space-y-3">
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
                <button className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-700">Enregistrer</button>
                {ok && <p className="text-sm text-green-700">Mot de passe mis à jour. Redirection…</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
        </div>
    );
}
