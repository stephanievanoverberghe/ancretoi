'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [sent, setSent] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const sp = useSearchParams();
    const next = sp.get('next') || '/app';

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setPending(true);
        const r = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, name, next }),
        });
        setPending(false);
        if (r.ok) setSent(true);
        else {
            const d = await r.json().catch(() => ({}));
            setError(d.error || 'Impossible d’envoyer le lien.');
        }
    }

    return (
        <div className="mx-auto max-w-md">
            <h1 className="mb-2 font-serif text-3xl">Créer un compte</h1>
            <p className="mb-4 text-muted-foreground">On t’envoie un lien de connexion par e-mail.</p>
            {sent ? (
                <div className="rounded-xl border border-border bg-card p-4">
                    <p>Vérifie ta boîte mail. Le lien expire dans 15 minutes.</p>
                </div>
            ) : (
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
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50" disabled={pending || !email}>
                        {pending ? 'Envoi…' : 'Créer mon compte'}
                    </button>
                </form>
            )}
        </div>
    );
}
