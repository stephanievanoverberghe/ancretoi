// src/app/settings/components/RecoveryContactsClient.tsx
'use client';
import { useEffect, useState } from 'react';

type Row = { email: string };

export default function RecoveryContactsClient() {
    const [rows, setRows] = useState<Row[]>([]);
    const [val, setVal] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/settings/recovery-contacts', { cache: 'no-store', credentials: 'same-origin' })
            .then((r) => r.json())
            .then((j) => setRows(Array.isArray(j?.contacts) ? j.contacts : []))
            .catch(() => {});
    }, []);

    async function add(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setMsg(null);
        if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            setErr('Email invalide');
            return;
        }
        setBusy(true);
        try {
            const r = await fetch('/api/settings/recovery-contacts', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email: val }),
                cache: 'no-store',
                credentials: 'same-origin',
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j?.ok) throw new Error(j?.error || 'Ajout impossible');
            setRows((s) => [...s, { email: val }]);
            setVal('');
            setMsg('Ajouté ✅');
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : 'Erreur');
        } finally {
            setBusy(false);
        }
    }

    async function del(email: string) {
        setBusy(true);
        setErr(null);
        setMsg(null);
        try {
            const r = await fetch('/api/settings/recovery-contacts', {
                method: 'DELETE',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email }),
                cache: 'no-store',
                credentials: 'same-origin',
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok || !j?.ok) throw new Error(j?.error || 'Suppression impossible');
            setRows((s) => s.filter((x) => x.email !== email));
            setMsg('Supprimé ✅');
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : 'Erreur');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-3" aria-live="polite">
            <form onSubmit={add} className="flex gap-2">
                <input
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
                    placeholder="email@exemple.com"
                    type="email"
                />
                <button disabled={busy} className="rounded-lg px-3 py-2 text-sm ring-1 ring-border hover:bg-muted">
                    Ajouter
                </button>
            </form>
            {!!rows.length && (
                <ul className="text-sm divide-y divide-border rounded-lg border">
                    {rows.map((r) => (
                        <li key={r.email} className="flex items-center justify-between px-3 py-2">
                            <span className="break-all">{r.email}</span>
                            <button onClick={() => del(r.email)} className="rounded-lg px-2.5 py-1 text-xs ring-1 ring-border hover:bg-muted">
                                Retirer
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {msg && <div className="text-xs text-emerald-700">{msg}</div>}
            {err && <div className="text-xs text-brand-700">{err}</div>}
            {!rows.length && <p className="text-xs text-muted-foreground">Ajoute 1–2 contacts de confiance pour récupérer l’accès à ton compte si besoin.</p>}
        </div>
    );
}
