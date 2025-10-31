// src/app/member/components/ProgressDonutClient.tsx
'use client';
import { useMemo } from 'react';

export default function ProgressDonutClient({ percent, size = 160, stroke = 14, label }: { percent: number; size?: number; stroke?: number; label?: string }) {
    const p = Math.max(0, Math.min(100, Math.round(percent)));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = useMemo(() => (c * p) / 100, [c, p]);

    return (
        <div role="img" aria-label={`Progression ${p}%`} className="relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-muted" strokeWidth={stroke} fill="none" opacity={0.25} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="currentColor"
                    className="text-brand-600"
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${c - dash}`}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dasharray .6s ease' }}
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
                <div className="text-sm font-semibold">{label ?? `${p}%`}</div>
            </div>
        </div>
    );
}
