'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    const sp = useSearchParams();
    const next = sp.get('next') || '/app';

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setPending(true);
        const r = await fetch('/api/auth/magic-link', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, next }),
        });
        setPending(false);
        if (r.ok) setSent(true);
        else setError('Impossible d’envoyer le lien. Réessaie dans quelques secondes.');
    }

    return (
        <div className="mx-auto max-w-md">
            <h1 className="mb-2 font-serif text-3xl">Connexion</h1>
            <p className="mb-4 text-muted-foreground">
                Entre ton e-mail — on t’envoie un <strong>lien d’accès unique</strong>.
            </p>

            {sent ? (
                <div className="rounded-xl border border-border bg-card p-4">
                    <p>Vérifie ta boîte mail. Le lien expire dans 15 minutes.</p>
                    {!process.env.NEXT_PUBLIC_RESEND && <p className="mt-2 text-sm text-muted-foreground">En développement sans Resend : le lien est affiché dans le terminal.</p>}
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-3">
                    <label htmlFor="email" className="sr-only">
                        Adresse e-mail
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@domaine.fr"
                        autoComplete="email"
                        className="w-full rounded-lg border border-input bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-invalid={Boolean(error)}
                    />

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50" disabled={pending || !email}>
                        {pending ? 'Envoi…' : 'Envoyer le lien magique'}
                    </button>
                </form>
            )}
        </div>
    );
}
