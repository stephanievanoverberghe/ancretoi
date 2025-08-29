'use client';

import * as React from 'react';
import type { SeriesPoint } from '@/lib/analytics.server';

type Props = {
    points: SeriesPoint[];
    height?: number;
    showFill?: boolean;
    ariaLabel?: string;
};

export default function Sparkline({ points, height = 56, showFill = true, ariaLabel }: Props) {
    const w = Math.max(points.length - 1, 1) * 28; // 28px par point
    const h = height;
    const values = points.map((p) => p.value);
    const max = Math.max(...values, 1);
    const min = 0;

    const x = (i: number) => (i / Math.max(points.length - 1, 1)) * (w - 8) + 4;
    const y = (v: number) => h - 6 - ((v - min) / (max - min)) * (h - 12);

    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');

    // Area (pour le remplissage)
    const dArea = `M ${x(0)} ${y(points[0]?.value ?? 0)} ` + points.map((p, i) => `L ${x(i)} ${y(p.value)}`).join(' ') + ` L ${x(points.length - 1)} ${h - 6} L ${x(0)} ${h - 6} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={ariaLabel ?? 'Sparkline'} className="block">
            <defs>
                <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgb(109 40 217)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="rgb(234 179 8)" stopOpacity="0.08" />
                </linearGradient>
            </defs>

            {showFill && <path d={dArea} fill="url(#spark-grad)" opacity={0.65} />}
            <path d={d} fill="none" stroke="rgb(109 40 217)" strokeWidth={2} />
            {/* points */}
            {points.map((p, i) => (
                <circle key={i} cx={x(i)} cy={y(p.value)} r={2.2} fill="white" stroke="rgb(109 40 217)" />
            ))}
        </svg>
    );
}
