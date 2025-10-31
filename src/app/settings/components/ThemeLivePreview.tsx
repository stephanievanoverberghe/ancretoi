'use client';
import { useEffect, useState } from 'react';

export default function ThemeLivePreview() {
    const [mode, setMode] = useState<'system' | 'light' | 'dark'>('system');

    useEffect(() => {
        const m = document.documentElement.dataset.theme as 'system' | 'light' | 'dark' | undefined;
        setMode(m || 'system');
        const obs = new MutationObserver(() => {
            const v = document.documentElement.dataset.theme as 'system' | 'light' | 'dark' | undefined;
            setMode(v || 'system');
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => obs.disconnect();
    }, []);

    return (
        <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground mb-2">
                Aperçu du thème : <span className="uppercase font-medium">{mode}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg h-14 bg-gradient-to-br from-brand-600/20 to-amber-400/20 ring-1 ring-black/5" />
                <div className="rounded-lg h-14 bg-muted" />
                <div className="rounded-lg h-14 bg-card ring-1 ring-border" />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Le thème est appliqué instantanément (sans rechargement).</p>
        </div>
    );
}
