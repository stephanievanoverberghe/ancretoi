// app/forgot-password/page.tsx
'use client';
import { useState } from 'react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState<string | null>(null);
    const [error, setError] = useState('');

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setSent(null);
        const r = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok) {
            setSent(d.devResetUrl || 'ok'); // en dev on montre le lien
        } else {
            setError(d?.error || 'Impossible d’envoyer le lien.');
        }
    }

    return (
        <div className="mx-auto max-w-md px-4 py-16 sm:py-20 sm:px-6 lg:py-24">
            <h1 className="mb-2 font-serif text-3xl">Mot de passe oublié</h1>
            <p className="mb-4 text-sm text-muted-foreground">Entre ton e-mail : si un compte existe, tu recevras un lien de réinitialisation.</p>
            <form onSubmit={submit} className="space-y-3">
                <input
                    className="w-full rounded-lg border border-input bg-card px-3 py-2"
                    type="email"
                    placeholder="email@domaine.fr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 cursor-pointer">Envoyer le lien</button>
            </form>
            {sent && (
                <div className="mt-4 rounded-lg border p-3 text-sm">
                    Lien envoyé.{' '}
                    {sent !== 'ok' && (
                        <div className="mt-2">
                            <div className="mb-1 font-medium">Lien (dev) :</div>
                            <a className="underline break-all" href={sent}>
                                {sent}
                            </a>
                        </div>
                    )}
                </div>
            )}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
    );
}
