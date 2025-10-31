// src/app/member/components/StreakHeatmapClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Row = { dateISO: string; active: boolean };

export default function StreakHeatmapClient({
    days = 30,
    size = 12,
}: {
    days?: number; // nb de jours récents à afficher
    size?: number; // taille d’une case en px
}) {
    const [rows, setRows] = useState<Row[] | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/me/streak', { cache: 'no-store' })
            .then((r) => r.json())
            .then((j) => {
                if (cancelled) return;
                if (!Array.isArray(j?.rows)) throw new Error('format invalide');
                setRows(j.rows as Row[]);
            })
            .catch(() => {
                if (cancelled) return;
                // Fallback ultra simple (alternance)
                const now = new Date();
                const tmp: Row[] = [];
                for (let i = days - 1; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(now.getDate() - i);
                    tmp.push({ dateISO: d.toISOString().slice(0, 10), active: i % 2 === 0 });
                }
                setRows(tmp);
                setErr('Données simulées');
            });
        return () => {
            cancelled = true;
        };
    }, [days]);

    const recent = useMemo(() => {
        if (!rows) return [];
        const slice = rows.slice(-days); // on prend les N derniers
        return slice;
    }, [rows, days]);

    if (!rows) return <div className="text-sm text-muted-foreground">Chargement…</div>;

    // Palette simple (inactif → actif)
    const color = (active: boolean) => (active ? 'bg-brand-600' : 'bg-muted');

    return (
        <div>
            <div className="flex flex-wrap gap-1" aria-label="Carte d’assiduité">
                {recent.map((r) => (
                    <div
                        key={r.dateISO}
                        title={`${r.dateISO} — ${r.active ? 'actif' : 'inactif'}`}
                        className={['rounded-[3px]', color(r.active), 'transition', 'hover:brightness-110', 'ring-1 ring-black/5'].join(' ')}
                        style={{ width: size, height: size }}
                        aria-label={`${r.dateISO} ${r.active ? 'actif' : 'inactif'}`}
                        role="img"
                    />
                ))}
            </div>
            {err && <div className="mt-1 text-[11px] text-amber-700">{err}</div>}
        </div>
    );
}
