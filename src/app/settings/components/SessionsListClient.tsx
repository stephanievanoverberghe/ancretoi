// src/app/settings/components/SessionsListClient.tsx

'use client';

import { useEffect, useState } from 'react';

type Session = {
    id: string;
    isCurrent: boolean;
    ua?: string | null;
    ip?: string | null;
    createdAt?: string | null;
    lastSeenAt?: string | null;
};

export default function SessionsListClient() {
    const [items, setItems] = useState<Session[] | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setBusy(true);
        fetch('/api/settings/sessions', { cache: 'no-store', credentials: 'same-origin' })
            .then((r) => r.json())
            .then((j) => setItems(Array.isArray(j?.sessions) ? j.sessions : []))
            .catch(() => setErr('Impossible de charger les sessions.'))
            .finally(() => setBusy(false));
    }, []);

    function parseUa(ua?: string | null) {
        if (!ua) return 'Appareil inconnu';
        const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
        const os = /Windows|Mac OS X|Android|iOS|Linux/i.exec(ua)?.[0] || 'OS inconnu';
        const browser = /(Chrome|Edg|Firefox|Safari)/i.exec(ua)?.[0] || 'Navigateur';
        return `${isMobile ? 'Mobile' : 'Desktop'} · ${os} · ${browser}`;
        // (Simple & robuste; on évite une lib UA dédiée ici)
    }

    if (busy && !items) {
        return <div className="text-sm text-muted-foreground">Chargement…</div>;
    }
    if (err) {
        return <div className="text-sm text-brand-700">{err}</div>;
    }
    if (!items || items.length === 0) {
        return <div className="text-sm text-muted-foreground">Aucune session active.</div>;
    }

    return (
        <ul className="divide-y divide-border text-sm">
            {items.map((s) => (
                <li key={s.id} className="py-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="font-medium">
                            {parseUa(s.ua)}{' '}
                            {s.isCurrent && <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700 ring-1 ring-emerald-200">Cette session</span>}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                            IP {s.ip || '—'} · Dernière activité {s.lastSeenAt ? new Date(s.lastSeenAt).toLocaleString() : '—'}
                        </div>
                    </div>
                    {!s.isCurrent && (
                        <form action={`/api/settings/sessions/${encodeURIComponent(s.id)}/revoke`} method="post">
                            <button className="rounded-lg px-2.5 py-1 text-xs ring-1 ring-border hover:bg-muted">Révoquer</button>
                        </form>
                    )}
                </li>
            ))}
        </ul>
    );
}
