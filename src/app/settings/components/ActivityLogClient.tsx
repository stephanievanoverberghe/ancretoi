// src/app/settings/components/ActivityLogClient.tsx

'use client';
import { useEffect, useState } from 'react';

type Item = {
    id: string;
    at: string; // ISO
    type: 'password' | 'email' | '2fa' | 'session' | 'export' | 'delete' | 'prefs';
    note?: string;
    ip?: string | null;
};

const LABELS: Record<Item['type'], string> = {
    password: 'Mot de passe modifié',
    email: 'Adresse e-mail modifiée',
    '2fa': '2FA modifiée',
    session: 'Session mise à jour',
    export: 'Export de données',
    delete: 'Suppression demandée',
    prefs: 'Préférences modifiées',
};

export default function ActivityLogClient() {
    const [items, setItems] = useState<Item[] | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/settings/activity', { cache: 'no-store', credentials: 'same-origin' })
            .then((r) => r.json())
            .then((j) => setItems(Array.isArray(j?.items) ? j.items : []))
            .catch(() => setErr('Chargement impossible'));
    }, []);

    if (err) return <div className="text-sm text-brand-700">{err}</div>;
    if (!items) return <div className="text-sm text-muted-foreground">Chargement…</div>;
    if (!items.length) return <div className="text-sm text-muted-foreground">Aucune activité récente.</div>;

    return (
        <ul className="text-sm divide-y divide-border rounded-lg border bg-white">
            {items.map((it) => (
                <li key={it.id} className="px-3 py-2 grid grid-cols-[1fr_auto] items-center gap-2">
                    <div>
                        <div className="font-medium">{LABELS[it.type]}</div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(it.at).toLocaleString()} {it.ip ? `· IP ${it.ip}` : ''} {it.note ? `· ${it.note}` : ''}
                        </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{it.type}</div>
                </li>
            ))}
        </ul>
    );
}
