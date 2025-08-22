'use client';
import { useState } from 'react';

export default function PasswordSettingsPage() {
    const [currentPassword, setCurrent] = useState('');
    const [newPassword, setNew] = useState('');
    const [pending, setPending] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setMsg(null);
        setErr(null);
        setPending(true);
        const r = await fetch('/api/auth/set-password', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        setPending(false);
        if (r.ok) {
            setMsg('Mot de passe mis à jour.');
            setCurrent('');
            setNew('');
        } else {
            const d = await r.json().catch(() => ({}));
            setErr(d?.error || 'Impossible de mettre à jour le mot de passe.');
        }
    }

    return (
        <div className="mx-auto max-w-md space-y-4">
            <h1 className="text-3xl font-semibold">Mot de passe</h1>
            <form onSubmit={submit} className="space-y-3">
                <input
                    type="password"
                    placeholder="Mot de passe actuel (laisse vide si aucun)"
                    className="w-full rounded-lg border border-input bg-card px-3 py-2"
                    value={currentPassword}
                    onChange={(e) => setCurrent(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Nouveau mot de passe (min 8 caractères)"
                    className="w-full rounded-lg border border-input bg-card px-3 py-2"
                    value={newPassword}
                    onChange={(e) => setNew(e.target.value)}
                />
                {err && <p className="text-sm text-red-600">{err}</p>}
                {msg && <p className="text-sm text-green-600">{msg}</p>}
                <button className="rounded-lg bg-brand px-4 py-2 text-white disabled:opacity-50" disabled={pending || newPassword.length < 8}>
                    {pending ? 'Enregistrement…' : 'Enregistrer'}
                </button>
            </form>
        </div>
    );
}
