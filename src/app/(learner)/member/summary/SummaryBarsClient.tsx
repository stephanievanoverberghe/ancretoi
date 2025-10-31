// src/app/member/summary/SummaryBarsClient.tsx
'use client';

export default function SummaryBarsClient({ items }: { items: { slug: string; title: string; percent: number }[] }) {
    if (!items?.length) return <div className="text-sm text-muted-foreground">Aucun programme encore.</div>;

    return (
        <ul className="space-y-3">
            {items.map((it) => (
                <li key={it.slug} className="grid grid-cols-[1fr_auto] gap-3 items-center">
                    <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{it.title}</div>
                        <div className="mt-1 h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-brand-600 transition-[width] duration-700"
                                style={{ width: `${Math.max(0, Math.min(100, it.percent))}%` }}
                                aria-label={`${it.title}: ${it.percent}%`}
                            />
                        </div>
                    </div>
                    <div className="text-sm tabular-nums">{it.percent}%</div>
                </li>
            ))}
        </ul>
    );
}
