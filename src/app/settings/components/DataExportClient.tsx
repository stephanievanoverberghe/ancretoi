// src/app/settings/components/DataExportClient.tsx
'use client';

import { useState } from 'react';

export default function DataExportClient() {
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function run() {
        setBusy(true);
        setErr(null);
        try {
            const r = await fetch('/api/settings/export', { method: 'POST' });
            if (!r.ok) throw new Error('Export impossible');
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ancretoi-export.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <button onClick={run} disabled={busy} className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-border hover:bg-muted">
                {busy ? 'Préparation…' : 'Télécharger le JSON'}
            </button>
            {err && <span className="text-xs text-brand-700">{err}</span>}
        </div>
    );
}
